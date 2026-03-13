Running Epoch Nations with Base44

Epoch Nations is deployed using Base44, which automatically builds and publishes the application when changes are pushed to the repository.

Base44 provides the hosted environment used for the official game instance, but developers can still run the project locally or host their own servers independently.

Base44 Development Setup

If you want to connect your local development environment to the Base44 deployment environment, follow these steps.

1 Clone the Repository
git clone https://github.com/YOUR_REPO/epoch-nations.git
cd epoch-nations
2 Install Dependencies

Install required Node.js packages:

npm install
3 Configure Environment Variables

Create a file called:

.env.local

Add the required Base44 configuration variables:

VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

Example:

VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app

These values allow your local development server to connect to the Base44 backend services.

4 Run the Development Server

Start the local development environment:

npm run dev

The game will be available at:

http://localhost:5173
Publishing Updates to Base44

When development changes are ready to be deployed:

Commit your changes to GitHub

Open the Base44 dashboard

Click Publish

Base44 will automatically rebuild and deploy the updated game.

Base44 Documentation

Official documentation:

https://docs.base44.com/Integrations/Using-GitHub

Base44 Support

Support portal:

https://app.base44.com/support

Important Note for Contributors

Base44 is used for deployment only.

The game itself is designed to run:

locally

on custom servers

on VPS hosting environments

Developers working on gameplay features or Forge plugins do not need to use Base44 directly unless they want to test deployment behavior.

Plugin Development with Base44 (Optional)

Developers may optionally use Base44 AI tools to generate plugins for the Forge SDK.

Example prompt:

Create an Epoch Nations plugin that adds a Solar Power Plant building producing 50 energy per tick.

The generated plugin should follow the standard Forge plugin structure and be submitted as a pull request.
