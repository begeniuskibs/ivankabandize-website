export const rnd = (i: number): number => {
  const x = Math.sin(i * 127.1 + 11.7) * 43758.5453
  return x - Math.floor(x)
}

export const gridP = (
  k: number,
  cols: number,
  x0: number,
  x1: number,
  y0: number,
  dy: number
): [number, number] => [
  x0 + ((k % cols) * (x1 - x0)) / (cols - 1),
  y0 + Math.floor(k / cols) * dy,
]

export const C = {
  co: '#EF5B45',
  gr: '#5A5D70',
  gn: '#5FD3A0',
  bl: '#7C93F0',
  wh: '#FDF8F1',
  go: '#E8B84A',
}

export const hund =
  (n: number, col: string, rest: string) =>
  (_s: number, i: number) => {
    const p = gridP(i, 10, 10, 90, 9, 7.6)
    return { x: p[0], y: p[1], c: i < n ? col : rest, s: 5.2 }
  }

export const scat =
  (col: string | ((i: number) => string)) =>
  (_s: number, i: number) => ({
    x: 8 + rnd(i) * 84,
    y: 8 + rnd(i + 500) * 66,
    c: typeof col === 'function' ? col(i) : col,
    s: 5.2,
  })
