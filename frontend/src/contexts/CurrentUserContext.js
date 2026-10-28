import { createContext } from "react";

const CurrentUserContext = createContext({
  user: null,
  token: null,
});

export default CurrentUserContext;