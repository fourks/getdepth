#version 150 core
#extension GL_ARB_explicit_attrib_location : enable
#extension GL_ARB_explicit_uniform_location : enable

// テクスチャ
layout (location = 0) uniform sampler2D depth;

#define NUI_CAMERA_DEPTH_NOMINAL_INVERSE_FOCAL_LENGTH_IN_PIXELS (3.501e-3)
#define NUI_IMAGE_PLAYER_INDEX_SHIFT 3
#define MILLIMETER 0.001
#define DEPTH_SCALE (-65535.0 * MILLIMETER / float(1 << NUI_IMAGE_PLAYER_INDEX_SHIFT))
#define DEPTH_MAXIMUM (-4.0)

// スケール
uniform vec2 scale = vec2(
  NUI_CAMERA_DEPTH_NOMINAL_INVERSE_FOCAL_LENGTH_IN_PIXELS * 320.0,
  NUI_CAMERA_DEPTH_NOMINAL_INVERSE_FOCAL_LENGTH_IN_PIXELS * 240.0
);

// テクスチャ座標
in vec2 texcoord;

// フレームバッファに出力するデータ
layout (location = 0) out vec3 position;

// 分散
uniform float variance = 0.1;

// 対象画素の値
float base;

// 重み付き画素値の合計と重みの合計を求める
void f(inout vec2 csum, const in float c, const in float w)
{
  float d = c - base;
  float e = exp(-0.5 * d * d / variance) * w;
  csum += vec2(c * e, e);
}

void main(void)
{
  // 対象画素の値を基準値とする
  base = texture(depth, texcoord).r;

  // 対象画素の値とその重みのペアを作る
  vec2 csum = vec2(base, 1.0);

#if 1
  f(csum, textureOffset(depth, texcoord, ivec2(-2, -2)).r, 0.018315639);
  f(csum, textureOffset(depth, texcoord, ivec2(-1, -2)).r, 0.082084999);
  f(csum, textureOffset(depth, texcoord, ivec2( 0, -2)).r, 0.135335283);
  f(csum, textureOffset(depth, texcoord, ivec2( 1, -2)).r, 0.082084999);
  f(csum, textureOffset(depth, texcoord, ivec2( 2, -2)).r, 0.018315639);

  f(csum, textureOffset(depth, texcoord, ivec2(-2, -1)).r, 0.082084999);
  f(csum, textureOffset(depth, texcoord, ivec2(-1, -1)).r, 0.367879441);
  f(csum, textureOffset(depth, texcoord, ivec2( 0, -1)).r, 0.60653066);
  f(csum, textureOffset(depth, texcoord, ivec2( 1, -1)).r, 0.367879441);
  f(csum, textureOffset(depth, texcoord, ivec2( 2, -1)).r, 0.082084999);

  f(csum, textureOffset(depth, texcoord, ivec2(-2,  0)).r, 0.135335283);
  f(csum, textureOffset(depth, texcoord, ivec2(-1,  0)).r, 0.60653066);
  f(csum, textureOffset(depth, texcoord, ivec2( 1,  0)).r, 0.60653066);
  f(csum, textureOffset(depth, texcoord, ivec2( 2,  0)).r, 0.135335283);

  f(csum, textureOffset(depth, texcoord, ivec2(-2,  1)).r, 0.082084999);
  f(csum, textureOffset(depth, texcoord, ivec2(-1,  1)).r, 0.367879441);
  f(csum, textureOffset(depth, texcoord, ivec2( 0,  1)).r, 0.60653066);
  f(csum, textureOffset(depth, texcoord, ivec2( 1,  1)).r, 0.367879441);
  f(csum, textureOffset(depth, texcoord, ivec2( 2,  1)).r, 0.082084999);

  f(csum, textureOffset(depth, texcoord, ivec2(-2,  2)).r, 0.018315639);
  f(csum, textureOffset(depth, texcoord, ivec2(-1,  2)).r, 0.082084999);
  f(csum, textureOffset(depth, texcoord, ivec2( 0,  2)).r, 0.135335283);
  f(csum, textureOffset(depth, texcoord, ivec2( 1,  2)).r, 0.082084999);
  f(csum, textureOffset(depth, texcoord, ivec2( 2,  2)).r, 0.018315639);
#endif

  // デプス値を取り出す
  float z = csum.r / csum.g;

  // デプス値からカメラ座標値を求める
  position = vec3((texcoord - 0.5) * scale * z, z);
}
