const { PhoneNumberFormat, PhoneNumberUtil } = require('google-libphonenumber')

exports.sanitizePhoneNumber = (input, defaultCountry = 'US') => {
  const phoneUtil = PhoneNumberUtil.getInstance()
  const number = phoneUtil.parseAndKeepRawInput(input, defaultCountry)

  if (!phoneUtil.isValidNumber(number)) {
    return null
  }

  return phoneUtil.format(number, PhoneNumberFormat.E164)
}
