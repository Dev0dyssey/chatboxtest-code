import countryData from '@/mockDatabase/country-info.json'
import { CountryData } from '@/types'

export default function getCountryInfo({country}: {country: string}) {
    const countryInfo = (countryData as CountryData)[country]
    
    if (!countryInfo) {
        return {
            error: `Sorry, I don't have information about "${country}". Please try a different country name.`,
            available_countries: "I have information about major countries like United States, France, Japan, etc."
        }
    }
    
    return countryInfo
}