#version 150 core
#extension GL_ARB_explicit_attrib_location : enable
#extension GL_ARB_explicit_uniform_location : enable

#define NUI_CAMERA_DEPTH_NOMINAL_INVERSE_FOCAL_LENGTH_IN_PIXELS (3.501e-3)
#define NUI_IMAGE_PLAYER_INDEX_SHIFT 3
#define MILLIMETER 0.001
#define DEPTH_SCALE (-65535.0 * MILLIMETER / float(1 << NUI_IMAGE_PLAYER_INDEX_SHIFT))
#define DEPTH_MAXIMUM (-4.0)

// スケール
const vec2 scale = vec2(
  NUI_CAMERA_DEPTH_NOMINAL_INVERSE_FOCAL_LENGTH_IN_PIXELS * 320.0,
  NUI_CAMERA_DEPTH_NOMINAL_INVERSE_FOCAL_LENGTH_IN_PIXELS * 240.0
);

// テクスチャ
layout (location = 0) uniform sampler2D depth;

// テクスチャ座標
in vec2 texcoord;

// フレームバッファに出力するデータ
layout (location = 0) out vec3 position;

// デプス値をスケーリングする
float s(in float z)
{
  return z == 0.0 ? DEPTH_MAXIMUM : z * DEPTH_SCALE;
}

void main(void)
{
  // デプス値を取り出す
  float z = s(texture(depth, texcoord).r);

  // デプス値からカメラ座標値を求める
  position = vec3((texcoord - 0.5) * scale * z, z);
}
