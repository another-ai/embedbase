import { useSmartChatStore } from '@/components/PrivateChat'
import { Dialog, Transition } from '@headlessui/react'
import {
  ClipboardDocumentCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Fragment, useState } from 'react'
import { toast } from 'react-hot-toast'
import { PrimaryButton } from './Button'
import { Input, Label } from './Input'
interface CopyToClipboardProps {
  textToCopy: string
  className?: string
}
export const CopyToClipboard = ({
  className,
  textToCopy,
}: CopyToClipboardProps) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
    toast.success('Copied to clipboard', { position: 'bottom-right' })
  }
  return (
    <div
      onClick={handleCopy}
      className={className + ' flex cursor-pointer items-center '}
    >
      {/* only display first 48 chars */}
      {textToCopy.substring(0, 48)}
      ...
      <ClipboardDocumentCheckIcon className="ml-1 h-3 w-3" />
    </div>
  )
}

interface ShareModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Example({ open, setOpen }: ShareModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState('')
  const system = useSmartChatStore((state) => state.systemMessage)
  const selectedDatasetIds = useSmartChatStore(
    (state) => state.selectedDatasetIds
  )
  console.log(selectedDatasetIds)
  const onShare = async () => {
    const response = await fetch('/api/createApp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        systemMessage: system,
        datasets: selectedDatasetIds,
      }),
    })
    const res = await response.json()
    console.log(res)
    if (res.error) {
      toast.error(res.error)
      return
    }
    setLink(res.link)
    setName('')
    setLoading(false)
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-2 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-transparent focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Share your Playground
                    </Dialog.Title>
                    <div className="mt-2 rounded-lg text-sm text-gray-700">
                      <p className="">
                        This will create a sharable link to your playground.
                        Anyone with the link will be able to use your playground
                        with your current settings.
                      </p>
                    </div>

                    <Dialog.Description className="mt-2 text-sm ">
                      <Label>Enter a name for your playground</Label>
                      {!link && (
                        <Input
                          className="mt-2 w-full"
                          autoFocus
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter a name for your playground"
                        />
                      )}
                    </Dialog.Description>
                    <div className="mt-2">
                      {loading ? (
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
                          <p className="text-sm text-gray-500">
                            Creating link...
                          </p>
                        </div>
                      ) : (
                        link && <CopyToClipboard textToCopy={link} />
                      )}
                    </div>
                  </div>
                </div>
                <div className='mt-3 font-semibold text-sm'>Using Share Settings</div>
                <div className="text-sm text-gray-600">Datasets</div>

                <div className="mt-1 rounded-lg bg-gray-50 py-2 px-4 text-sm text-gray-700">
                  <ul className="list-inside list-disc">
                    {selectedDatasetIds.map((dataset) => (
                      <li key="dataset">{dataset}</li>
                    ))}
                  </ul>
                  <p></p>
                </div>
                <div className="mt-3 text-sm text-gray-600">System Message</div>
                <div className="mt-1 rounded-lg bg-gray-50 py-2 px-4 text-sm text-gray-700">
                  <p className="mt-2">{system}</p>
                </div>
                <div className="mt-5 sm:mt-6">
                  {!link && (
                    <PrimaryButton
                      type="button"
                      disabled={loading || !name}
                      className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
                      onClick={onShare}
                    >
                      Create shareable link
                    </PrimaryButton>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
