const getElementComputedStyleProperties = require('./getElementComputedStyleProperties')

function isElementScrollable([element] = []) {
  const p = getElementComputedStyleProperties([element, ['overflow-x', 'overflow-y', 'overflow']])
  return (
    ((p[0] === 'scroll' || p[0] === 'auto') && (element.scrollWidth > element.clientWidth)) ||
    ((p[1] === 'scroll' || p[1] === 'auto') && (element.scrollHeight > element.clientHeight)) ||
    ((p[2] === 'hidden') && (element.scrollHeight > element.clientHeight))
  )
}

module.exports = isElementScrollable
