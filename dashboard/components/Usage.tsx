import Card from './Card'

// a react component that displays the plan usage

/**
 * 
{
  id: 97,
  planId: '...',
  userId: '...',
  usage: 1,
  createdAt: '2023-04-20T09:15:48.338376+00:00',
  updatedAt: '2023-04-20T09:15:48.338376+00:00'
}
*/

export interface UsageItem {
  id: number
  planId: string
  userId: string
  usage: number
  createdAt: string
  updatedAt: string
}

// const stats = [
//     { name: 'Daily Playground Usage', stat: '3', previousStat: '7', change: '42%', changeType: 'decrease' },
//     { name: 'Avg. Open Rate', stat: '58.16%', previousStat: '56.14%', change: '2.02%', changeType: 'increase' },
//     { name: 'Avg. Click Rate', stat: '24.57%', previousStat: '28.62%', change: '4.05%', changeType: 'decrease' },
// ]

const convertUsageToStats = (usage: UsageItem[]) => {
  // sum over monthly usage by creating a map of
  // month -> usage
  const monthlyPlaygroundUsage = usage.reduce((acc, item) => {
    const month = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    if (acc[month]) {
      acc[month] += item.usage
    } else {
      acc[month] = item.usage
    }
    return acc
  }, {})
  // get the total usage
  // const totalPlaygroundUsage = Object.values(dailyPlaygroundUsage).reduce((acc, item) => acc + item, 0)
  const keys = Object.keys(monthlyPlaygroundUsage)
  // get current month usage or 0 if no usage
  const currentMonth = keys.length > 0 ? monthlyPlaygroundUsage[keys[keys.length - 1]] : 0
  // const lastMonth =
  // keys.length > 1 ? dailyPlaygroundUsage[keys[keys.length - 2]] : 0
  // const changeInPercentage = ((today - yesterday) / (yesterday || 1)) * 100
  return [
    {
      name: 'Monthly Playground Usage',
      stat: currentMonth,
      // previousStat: yesterday,
      // change: `${changeInPercentage}%`,
      // changeType: changeInPercentage > 0 ? 'increase' : 'decrease'
    },
  ]
}

interface UsageProps {
  usage: UsageItem[]
  // current plan limit
  limit: number
}

export default function Usage({ usage, limit }: UsageProps) {
  const stats = convertUsageToStats(usage)
  console.log(stats)
  return (
    // just wrap text not more width
    <div className="w-1/3">
      <h3 className="text-base font-semibold leading-6 text-gray-900">
        Your usage
      </h3>
      <Card className='mt-3'>
        <dl className="divide-y divide-gray-200 rounded-lg md:divide-x md:divide-y-0 ">
          {stats.map((item) => (
            <div key={item.name} className="">
              <dt className="text-base font-normal text-gray-900">
                {item.name}
              </dt>
              <dd className="mt-1 flex items-baseline gap-4 md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-gray-900">
                  {item.stat}
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    / {limit}
                  </span>
                </div>

                {/* <div
                                className={classNames(
                                    item.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                                    'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0'
                                )}
                            >
                                {item.changeType === 'increase' ? (
                                    <ArrowUpIcon
                                        className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <ArrowDownIcon
                                        className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-red-500"
                                        aria-hidden="true"
                                    />
                                )}

                                <span> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                                {item.change}
                            </div> */}
                </dd>
              </div>
            ))
          }
      </dl>
    </Card>
    </div >
  )
}
