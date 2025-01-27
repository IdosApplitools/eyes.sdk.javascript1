import type {Refer} from './refer'
import type {Eyes, Ref} from '@applitools/types'

async function abort<TDriver, TElement, TSelector>({
  refer,
  eyes,
}: {
  refer: Refer
  eyes: Ref<Eyes<TDriver, TElement, TSelector>>
}) {
  const eyesInstance = refer.deref(eyes)
  if (!eyesInstance) return
  const results = await eyesInstance.abort()
  refer.destroy(eyes)
  return results
}

export {abort}
