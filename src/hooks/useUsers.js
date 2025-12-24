import { useEffect, useState } from "react";
import { useGetUsersQuery } from "../redux/usersSlice";

export const useUsers = () => {
  console.log(` `);
  console.log(` `);
  console.log(`useUsers ----START START`);
  console.log(`useUsers ----START START`);

  // Get all ireps users
  const { data: users, isLoading, isError, isFetching } = useGetUsersQuery();
  console.log(`useUsers ----users`, users);
  console.log(`useUsers ----isLoading`, isLoading);
  console.log(`useUsers ----isError`, isError);
  console.log(`useUsers ----isFetching`, isFetching);

  const [activeUsers, setActiveUsers] = useState(); // Active erfs are the one currently on display
  console.log(`useUsers ----activeUsers`, activeUsers);

  const [activeUsersName, setActiveUsersName] = useState();

  useEffect(() => {
    console.log(`useUsers ----useEffect Setting active users`);
    setActiveUsers(users); // Default to the first 10 erfs
    setActiveUsersName("users");
  }, [users]);

  console.log(`useUsers ----END END`);
  console.log(`useUsers ----END END`);
  console.log(` `);
  console.log(` `);

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
