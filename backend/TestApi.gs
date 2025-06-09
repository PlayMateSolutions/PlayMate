const token = 'Bearer ya29.a0AW4XtxgVVsHQ1WhR-NUpJmfORb75IX1nHg2Zv84WWWo277SUOrDKuZkFh-7wPyelrZLpj4Yj5LiXkCyE0vw-aY6Ye8Dgo6pyga86izUPVEt7UgH-I9fK50A3_VMvLQiteO2WlC9Qp0QVw_Q_o38cswZhvnhKE_AL2y68-lHhaCgYKAWYSARUSFQHGX2MifCPpySBNHoskgTFFogLjIw0175';

function testGetMembers() {
  // Mock event with URL parameters
  const mockEvent = {
    parameter: {
      action: "getMembers",
      authorization: token
    }
  };

  // Call doGet
  const response = doGet(mockEvent);
  Logger.log(response.getContent());
}

function testRecordAttendance() {
  // Mock event with URL parameters
  const mockEvent = {
    parameter: {
      action: "recordAttendance",
      payload: JSON.stringify({
        memberId: "1",
        date: new Date().toISOString(),
        checkInTime: new Date().toISOString()
      })
    }
  };

  // Call doGet/doPost
  const response = doPost(mockEvent);
  Logger.log("Response from recordAttendance:");
  Logger.log(response.getContent());
}