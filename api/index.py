import os

from server import create_app

app = create_app()

if __name__ == '__main__':
	app.run(debug=True, port=os.getenv("PORT", default=5000))

# 在模块中定义 __all__ 变量，可以控制 from module import * 时哪些变量会被导出
__all__ = ["app"]
