export async function parseResponseJson(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch (err) {
    // include small portion of the body to help debugging
    const snippet = text ? text.slice(0, 1000) : ''
    throw new Error(`Expected JSON response but received: ${snippet}`)
  }
}

export default parseResponseJson


