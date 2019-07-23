#version 150 core
#extension GL_ARB_explicit_attrib_location : enable
#extension GL_ARB_explicit_uniform_location : enable

// 疑似カラー処理を行う場合は 1
#define PSEUDO_COLOR 1

// 光源
layout (std140) uniform Light
{
  vec4 lamb;                                          // 環境光成分
  vec4 ldiff;                                         // 拡散反射光成分
  vec4 lspec;                                         // 鏡面反射光成分
  vec4 lpos;                                          // 位置
};

// 材質
layout (std140) uniform Material
{
  vec4 kamb;                                          // 環境光の反射係数
  vec4 kdiff;                                         // 拡散反射係数
  vec4 kspec;                                         // 鏡面反射係数
  float kshi;                                         // 輝き係数
};

// 変換行列
uniform mat4 mv;                                      // モデルビュー変換行列
uniform mat4 mp;                                      // 投影変換行列
uniform mat4 mn;                                      // 法線ベクトルの変換行列

// テクスチャ
uniform sampler2D position;                           // 頂点位置のテクスチャ
uniform sampler2D color;                              // カラーのテクスチャ

// 疑似カラー処理
uniform vec2 range = vec2(0.3, 6.0);

// 頂点属性
layout (location = 0) in vec2 pc;                     // 頂点のテクスチャ座標
layout (location = 1) in vec2 cc;                     // カラーのテクスチャ座標
layout (location = 2) in vec3 nv;                     // 法線ベクトル

// ラスタライザに送る頂点属性
out vec4 idiff;                                       // 拡散反射光強度
out vec4 ispec;                                       // 鏡面反射光強度
out vec2 texcoord;                                    // テクスチャ座標

void main(void)
{
  // 頂点位置
  vec4 pv = texture(position, pc);

  // 座標計算
  vec4 p = mv * pv;                                   // 視点座標系の頂点の位置

  // クリッピング座標系における座標値
  gl_Position = mp * p;

  // テクスチャ座標
  texcoord = cc / vec2(textureSize(color, 0));

  // 陰影計算
  vec3 v = normalize(p.xyz);                          // 視線ベクトル
  vec3 l = normalize((lpos * p.w - p * lpos.w).xyz);  // 光線ベクトル
  vec3 n = normalize(vec3(mn) * nv);                  // 法線ベクトル
  vec3 h = normalize(l - v);                          // 中間ベクトル

#if PSEUDO_COLOR
  // 疑似カラー処理
  float z = -6.0 * (pv.z + range.s) / (range.t - range.s);
  vec4 c = clamp(vec4(z - 2.0, 2.0 - abs(z - 2.0), 2.0 - z, 1.0), 0.0, 1.0);

  // 拡散反射光強度
  idiff = c * max(dot(n, l), 0.0) * kdiff * ldiff + kamb * lamb;
#else
  // 拡散反射光強度
  idiff = max(dot(n, l), 0.0) * kdiff * ldiff + kamb * lamb;
#endif

  // 鏡面反射光強度
  ispec = pow(max(dot(n, h), 0.0), kshi) * kspec * lspec;
}
