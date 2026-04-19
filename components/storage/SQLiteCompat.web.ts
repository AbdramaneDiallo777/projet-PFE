const SQLiteCompat = {
  openDatabaseSync: () => ({
    execSync: () => [],
    getAllSync: () => [],
    getFirstSync: () => null,
    runSync: () => ({ changes: 0, lastInsertRowId: 0 }),
    prepareSync: () => ({
      executeSync: () => ({
        getAllSync: () => [],
        getFirstSync: () => null,
        resetSync: () => {},
      }),
      finalizeSync: () => {},
    }),
  }),
};

export default SQLiteCompat;
