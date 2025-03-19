import os

from server import create_app

if __name__ == '__main__':
	app = create_app()
	app.run(debug=True, port=os.getenv("PORT", default=5000))
