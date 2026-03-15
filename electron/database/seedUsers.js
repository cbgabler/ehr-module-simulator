export async function seedDefaultUsers() {
  const { getUserByUsername, registerUser } = await import("./models/users.js");

  const defaultUsers = [
    { username: "instructor1", password: "password123", role: "instructor" },
    { username: "student1", password: "password123", role: "student" },
  ];

  for (const user of defaultUsers) {
    try {
      if (getUserByUsername(user.username)) continue;
      registerUser(user);
      console.log(`Created default user: ${user.username} (${user.role})`);
    } catch (error) {
      console.error(`Error creating user ${user.username}:`, error);
    }
  }
}
