/**
 * Simple test for addMember function
 */
function testAddMember() {
  // Mock member data
  const mockMember = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    joinDate: new Date("2025-05-25"),
    status: "Active",
    sports: ["Tennis", "Swimming"],
    notes: "Test member"
  };
  
  // Call the function with mock data
  try {
    const memberId = addMember(mockMember);
    console.log("Member added successfully with ID:", memberId);
    return memberId;
  } catch (error) {
    console.error("Error adding member:", error.message);
    return null;
  }
}