# TeamBeat

*What is this?*

TeamBeat is a tool to enable teams to easily facilitate remote retrospectives.

# How to run the application

1. Clone the repo
2. `npm install`
3. `npm run dockerbuild`
4. `npm run dockerrun`

# How to run the application in dev mode

1. Clone the repo
2. `npm install`
3. In one terminal window, run `npm run pocketbase`
4. In another termainl window, run `npm run dev`

# After the application is started in production or dev mode:

1. Open the admin interface on port 8080 of the docker instance at (for example): http://localhost:8080:/_/
2. Create an admin account and import the schema.json file from the repo into the form at: http://localhost:8080/_/#/settings/import-collections
3. Go to the root URL and create and account to begin using the application

This procedure should only be necessary once if the /pb/ directory is preserved between runs.

# To Do
1. ~Add the schema export to the repo~
2. Provide a way for the application to bootstrap the schema from the static directory
3. Use websockets to monitor the board list for updates on the main page
4. Use websockets to montior the current scene on the board page
5. Add voting
6. Add Commenting
7. Add presentation mode
8. Add voting card type
9. Restrict facilitation controls to facilitators
10. Restrict data modification via API based on auth rules
11. Ability to send board URLs that allow login-free (but user-tracked) access
