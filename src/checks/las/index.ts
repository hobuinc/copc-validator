import { Getter, Las, Binary } from 'copc'
import header from './header'
import { Check } from 'types'

export const LasChecks: Check.Groups<Binary> = {
  header,
}
