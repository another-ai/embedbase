import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline'
import { SupabaseClient, User, createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { SecondaryButton } from '../../../components/Button'
import Dashboard from '../../../components/Dashboard'
import { EMBEDBASE_CLOUD_URL } from '../../../utils/constants'


const pageSize = 25;
const DataTable = ({ documents, page, count, datasetId, userId }) => {
  const supabase = useSupabaseClient()
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast('Copied to clipboard!')
  }
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(documents[0].public === true);

  const onShareDataset = async () => {
    console.log(`making dataset ${userId}:${datasetId} ${!isPublic ? 'public' : 'private'}`);

    let res = await supabase
      .from('documents')
      .update({ public: !isPublic })
      .eq('dataset_id', datasetId)
      .eq('user_id', userId)

    console.log(res);

    if (res.error) {
      console.log(res.error);
      return toast.error(res.error.message);
    }

    res = await supabase.from('datasets').update({ public: !isPublic })
      .eq('name', datasetId)
      .eq('owner', userId)
    console.log(res);

    if (res.error) {
      console.log(res.error);
      return toast.error(res.error.message);
    }

    setIsPublic(!isPublic);

    console.log(`dataset ${datasetId} is now ${!isPublic ? 'public' : 'private'}`);
    toast(`dataset ${datasetId} is now ${!isPublic ? 'public' : 'private'}`);
    return res;
  }

  return (
    <div className="rounded-md px-4">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          {/* previous */}
          <SecondaryButton
            className="flex gap-1"
            onClick={() =>
              router.push(`/dashboard/explorer/${datasetId}/?page=${page - 1}`)
            }
            disabled={page === 0}
          >
            <ArrowLeftCircleIcon className="h-5 w-5" />
            Previous
          </SecondaryButton>
          {/* next */}
          <SecondaryButton
            className="flex gap-1"
            onClick={() =>
              router.push(`/dashboard/explorer/${datasetId}/?page=${page + 1}`)
            }
            disabled={page * pageSize + pageSize >= count}
          >
            Next
            <ArrowRightCircleIcon className="h-5 w-5" />
          </SecondaryButton>
          {/* dispaly count */}
          <div className="text-gray-500">
            {page * pageSize} - {page * pageSize + pageSize} of {count}
          </div>
          {/* public or not */}
          <div>
            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
              {
                isPublic ? 'Public' : 'Private'
              }
            </span>

          </div>
        </div>

        <div className="flex-col justify-end">

          <SecondaryButton
            onClick={onShareDataset}
            className="gap-1 flex-1"
          >
            <ShareIcon height={18} width={18} />
            Make {
              isPublic ? 'Private' : 'Public'
            }
          </SecondaryButton>
          {/* show small message beneath explaining what it implies aligned to the end  */}
          <div className="text-gray-500 text-xs text-right">
            {
              isPublic ?
                <p>This dataset is currently public. Anyone on the internet can read and search this dataset.<br /> Only you can add and write to this dataset.</p> :
                <p>This dataset is currently private.<br /> Only you can read and write to this dataset.</p>
            }
          </div>
        </div>
      </div>

      <table className="min-w-full  ">
        <tbody className="space-y flex flex-col space-y-4">
          {documents.map((document) => (
            <tr
              key={document.id}
              className="rounded-lg border border-gray-300 bg-white"
            >
              {/* copy to clipboard on click */}
              <td
                className=" cursor-context-menu px-4 py-4 text-xs	text-gray-500"
                onClick={() => handleCopyToClipboard(document.id)}
              >
                {document.id.slice(0, 10)}
              </td>
              <td>
                <div className="max-h-[100px] px-3 py-3.5 text-left text-sm text-gray-900">
                  {/* only keep first 15 chars */}
                  {document.data.slice(0, 100)}...
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



export default function Index({ datasetId, documents, page, count, user }: {
  datasetId: string
  documents: any[],
  page: number,
  count: number,
  user: User,
}) {
  return (
    <Dashboard>
      <div className="py-8">
        <DataTable
          documents={documents}
          page={page}
          count={count}
          datasetId={datasetId}
          userId={user.id}
        />
      </div>
    </Dashboard>
  )
}

const getPagination = (page: number, size: number) => {
  const limit = size ? +size : 3
  const from = page ? page * limit : 0
  const to = page ? from + size : size

  return { from, to }
}

const getDatasets = async (apiKey: string) => {
  const { datasets } = await fetch(EMBEDBASE_CLOUD_URL + '/v1/datasets', {
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
  }).then((res) => res.json())
  const formattedDatasets = datasets.map((dataset: any) => ({
    id: dataset.dataset_id,
    documentsCount: dataset.documents_count,
  }))
  return formattedDatasets
}

export const getApiKeys = async (supabase: SupabaseClient, userId) => {
  const { data, status, error } = await supabase
    .from('api-keys')
    .select()
    .eq('user_id', userId)

  if (error && status !== 406) {
    throw error
  }

  // get the first api key
  const apiKey = data[0].api_key
  if (!apiKey) {
    throw new Error('No API key found')
  }
  return apiKey
}

const getDocuments = async (
  supabase: SupabaseClient,
  datasetId: string,
  userId: string,
  range: { from: number; to: number }
) => {
  const { from, to } = range

  const res = await supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('dataset_id', datasetId)
    .eq('user_id', userId)
    // .order('id', { ascending: true })
    .range(from, to)

  if (res.error && res.status !== 406) {
    throw res.error
  }
  return res
}

export const getServerSideProps = async (ctx) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx)
  const { page = 0, size } = ctx.query
  const { from, to } = getPagination(page, pageSize)
  const datasetId = ctx?.query?.datasetId

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()


  let apiKey: string = ''
  let formattedDatasets: any = []

  let documents: any = []
  let count: number = 0
  try {
    const apiKey = await getApiKeys(supabase, session.user.id)
    formattedDatasets = await getDatasets(apiKey)
    const res = await getDocuments(supabase, datasetId, session.user.id, {
      from,
      to,
    })
    documents = res.data
    count = res.count
  } catch (error) {
    console.log(error)
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
      apiKey,
      datasets: formattedDatasets,
      datasetId,
      documents,
      count: count,
      page: +page,
    },
  }
}
