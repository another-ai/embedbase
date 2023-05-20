import * as Sentry from '@sentry/nextjs'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { ClientAddData, createClient } from 'embedbase-js'
import { splitText } from 'embedbase-js/dist/main/split'
import fs from 'fs'
import pdfParse from 'pdf-parse'

import formidable from 'formidable'

const EMBEDBASE_URL = 'https://api.embedbase.xyz'

export const config = {
  api: {
    bodyParser: false,
  },
  // runtime: 'edge'
}


const getApiKey = async (req, res) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient({ req, res })
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let apiKey: string = ''

  try {
    const { data, status, error } = await supabase
      .from('api-keys')
      .select()
      .eq('user_id', session?.user?.id)

    if (error && status !== 406) {
      throw error
    }
    // get the first api key
    apiKey = data[0].api_key
    if (!apiKey) {
      throw new Error('No API key found')
    }
  } catch (error) {
    console.log(error)
  }
  return apiKey
}

export default async function sync(req: any, res: any) {
  console.log(req)
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm()
    const apiKey = await getApiKey(req, res)
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }

    console.log('step 2')
    const startTime = Date.now()
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err, fields, files)
        Sentry.captureException(err)
        res.status(500).json({ message: 'Error processing request' })
        return
      }

      const datasetId = fields.datasetId as string
      console.log('datasetId:', datasetId)

      const embedbase = createClient(EMBEDBASE_URL, apiKey)
      console.log('after create client')

      // HACK to create dataset
      await embedbase.dataset(datasetId).add('.')
      console.log('after empty add')

      const file = files.file as any
      const pdfPath = file.filepath
      const pdfData = fs.readFileSync(pdfPath)
      console.log('after read sync')

      try {
        console.log('PDF data:', file)
        const metadata: any = {
          name: file.originalFilename,
          mimeType: file.mimetype,
          lastModifiedDate: file.lastModifiedDate,
          size: file.size,
        }
        const pdfText = await pdfParse(pdfData)
        // remove \\u0000 -> cannot be converted to text
        const fixedPdf = pdfText.text.replace(/\u0000/g, '')

        console.log('PDF Content:', fixedPdf)

        const promises: Promise<ClientAddData[]>[] = []
        await splitText(fixedPdf).batch(100).forEach((batch) =>
          promises.push(embedbase.dataset(datasetId).batchAdd(
            batch.map((c) => ({ data: c.chunk, metadata: metadata }))
          ))
        )

        await Promise.all(promises)

        console.log(
          `Synced to ${datasetId} in ${Date.now() - startTime
          }ms`
        )
        res.status(200).json({ message: 'File uploaded successfully' })

        // Save the PDF file to the server
        // const pdfFilePath = path.join(process.cwd(), ".", "uploaded-file.pdf");
        // fs.writeFileSync(pdfFilePath, pdfData);
      } catch (error) {
        Sentry.captureException(error)
        console.log(error)
        res.status(500).json({ message: 'Error parsing PDF' })
      }
    })
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
