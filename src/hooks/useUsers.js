import { useEffect, useState } from "react";
import { useGetUsersQuery } from "../redux/usersApi";

export const useUsers = () => {
  // Get all ireps users
  const { data: users, isLoading, isError, isFetching } = useGetUsersQuery();
  const [activeUsers, setActiveUsers] = useState(); // Active erfs are the one currently on display

  const [activeUsersName, setActiveUsersName] = useState();

  useEffect(() => {
    setActiveUsers(users); // Default to the first 10 erfs
    setActiveUsersName("users");
  }, [users]);

  return {
    // users,
    activeUsers,
    setActiveUsers,
    activeUsersName,
    setActiveUsersName,

    isLoading,
    isError,
    isFetching,
  };
};
