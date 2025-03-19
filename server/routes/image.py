from flask import Blueprint, request, current_app, send_file

from PIL import Image
import pillow_avif  # 注意一定要引入pillow_avif否则会抛异常'cannot identify image file 'XXX''
import requests
from io import BytesIO

image_blue = Blueprint('image_blue', __name__, url_prefix='/image')


def convert_image(image_data, image_format, quality=None, size=None):
	"""将图片转换为指定格式，并根据条件压缩"""
	image = Image.open(BytesIO(image_data))

	# 调整图片尺寸（如果指定了 size）
	if size:
		target_width, target_height = map(int, size.split('x'))  # 解析目标尺寸，如 "800x600"
		original_width, original_height = image.size

		# 计算保持宽高比的尺寸
		ratio = min(target_width / original_width, target_height / original_height)
		new_width = int(original_width * ratio)
		new_height = int(original_height * ratio)

		# 调整图片尺寸
		image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

	# 转换图片格式并保存
	output = BytesIO()
	save_kwargs = {'format': image_format}
	if quality:
		save_kwargs['quality'] = int(quality)  # 设置图片质量
	image.save(output, **save_kwargs)
	output.seek(0)
	return output


@image_blue.route('/to_<image_format>', methods=['POST', 'GET'])
def convert_to_format(image_format):
	if request.method == 'GET':
		# 处理 GET 请求，从 query 参数中获取图片 URL
		image_url = request.args.get('url')
		if not image_url:
			return "Missing 'url' parameter", 400
		try:
			response = requests.get(image_url)
			response.raise_for_status()
			image_data = response.content
		except Exception as e:
			return f"Failed to fetch image: {str(e)}", 400
	else:
		# 处理 POST 请求，从 request.body 中读取图片数据
		if not request.data:
			return "Missing image data", 400
		image_data = request.data

	# 获取压缩参数
	quality = request.args.get('quality')  # 图片质量（0-100）
	size = request.args.get('size')  # 图片尺寸（如 "800x600"）

	# 转换图片格式并压缩
	try:
		converted_image = convert_image(image_data, image_format.upper(), quality=quality, size=size)
		return send_file(converted_image, mimetype=f'image/{image_format.lower()}')
	except Exception as e:
		return f"Failed to convert image: {str(e)}", 500
