# 导入Flask类
import os

from flask import Flask, request, jsonify
# 导入蓝图
from .routes.image import image_blue

# 实例化，可视为固定格式
app = Flask(__name__)
app.config['API_KEY'] = os.environ.get('API_KEY', '123456')
API_KEY = app.config['API_KEY']


# request 拦截器
# 如果 handler_before_request 返回 None，Flask 会继续处理请求，调用相应的视图函数
@app.before_request
def handler_before_request():
	# 检查请求头中是否包含 API Key
	api_key = request.headers.get('X-API-KEY')
	if api_key != API_KEY:
		# 如果 API Key 无效，返回 401 Unauthorized
		return jsonify({"error": "Unauthorized"}), 401
	# 如果 API Key 有效，继续处理请求
	return None


# response 拦截器
@app.after_request
def handler_after_request(response):
	return response


# 创建app
def create_app():
	# 注册蓝图
	app.register_blueprint(blueprint=image_blue)
	return app


#
if __name__ == "__main__":
	# 创建app
	app = create_app()
	# 启动服务
	app.run(debug=True, port=os.getenv("PORT", default=5000))
