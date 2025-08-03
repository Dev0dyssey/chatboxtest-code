import countryData from '@/mockDatabase/country-info.json'
import { CountryData } from '@/types'

export default function getCountryInfo({country}: {country: string}) {
    const countryInf = (countryData as CountryData)[country]
    return countryInf
}