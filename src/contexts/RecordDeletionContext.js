import { createContext, useContext } from 'react';
export const RecordDeletionContext = createContext(null);
export const useRecordDeletions = () => useContext(RecordDeletionContext);
