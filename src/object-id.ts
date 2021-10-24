export const objectId = (() => {
  let currentId = 0
  const map = new WeakMap()

  return (object) => {
    if (!map.has(object)) {
      map.set(object, ++currentId)
    }

    return map.get(object)
  }
})()
