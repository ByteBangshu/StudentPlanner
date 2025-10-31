<!DOCTYPE html>
<html>
    <style>
      .change-password-box {
        border: 2px solid black;
        padding: 10px;
        width: 300px;
      }
    </style>
  <head>
    <title>User Profile</title>
  </head>
  <body>
    <h2>User Profile</h2>

    <p>Name: <span id="username">John Doe</span></p>
    <p>Homework Points: <span id="points">??</span></p>
	<br><br>
	<form action="#" method="post">
      <button type="submit">Sign Out</button>
    </form>
	<br><br>
	<div class="change-password-box">
    <h3>Change Password</h3>
    <form action="#" method="post">
      <label for="current">Current Password:</label>
      <input type="password" id="current" name="current"><br><br>

      <label for="new">New Password:</label>
      <input type="password" id="new" name="new"><br><br>

      <label for="confirm">Confirm New Password:</label>
      <input type="password" id="confirm" name="confirm"><br><br>

      <button type="submit">Change Password</button>
    </form>
	</div>
    <br>

  </body>
</html>
