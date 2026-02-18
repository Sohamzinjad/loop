const buildLogger = () => {
  const base = {
    app: "EcoChain",
  };

  return {
    info(message: string, meta?: unknown) {
      console.info(message, { ...base, meta });
    },
    warn(message: string, meta?: unknown) {
      console.warn(message, { ...base, meta });
    },
    error(message: string, meta?: unknown) {
      console.error(message, { ...base, meta });
    },
  };
};

export const logger = buildLogger();
