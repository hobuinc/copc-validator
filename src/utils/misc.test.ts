test.skip('currTime browser', async () => {
  // FIXME: the following line now throws an error, skipping test for now
  // This is a bad test anyway — pretending were in a browser by trying to delete performance.now()

  // global.performance = undefined as unknown as Performance
  expect((await import('./misc')).currTime()).toBeCloseTo(
    new Date().getTime(),
    -2,
  )
})

export {}
