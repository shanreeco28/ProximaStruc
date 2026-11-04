import { createContext, useContext } from 'react';
// Project roster, used to show people's names instead of sign-in emails on records.
export const PeopleContext = createContext([]);
export const usePeople = () => useContext(PeopleContext);
