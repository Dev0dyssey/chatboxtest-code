export default {
    name: "getCountryInfo",
    description: "Returns capital, currency, timezone, language, and a travel fact for a given country",
    parameters: {
      type: "object",
      properties: {
        country: {
          type: "string",
          description: "The full country name, e.g. 'United Kingdom'"
        }
      },
      required: ["country"]
    }
  };