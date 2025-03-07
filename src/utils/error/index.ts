export const logException = (e: unknown) => {
  if (e instanceof Error) {
    console.error(e.message);
  } else {
    console.error(e);
  }
};
