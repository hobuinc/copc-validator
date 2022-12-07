test('currTime browser', async () => {
  global.performance = undefined as unknown as Performance
  expect((await import('./misc')).currTime()).toBeCloseTo(
    new Date().getTime(),
    -2,
  )
})

export {}
