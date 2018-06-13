﻿//
// Kinect (v2) のデプスマップ取得
//

// センサ関連の処理
//#include "KinectV1.h"
#include "KinectV2.h"
//#include "Ds325.h"

// 各種設定
#include "config.h"

// ウィンドウ関連の処理
#include "GgApplication.h"

// 描画に用いるメッシュ
#include "Mesh.h"

// 計算に用いるシェーダ
#include "Calculate.h"

// 頂点位置の生成をシェーダ (position.frag) で行うなら 1
#define GENERATE_POSITION 1

//
// アプリケーションの実行
//
void GgApplication::run()
{
  // GLFW を初期化する
  if (glfwInit() == GL_FALSE) throw "GLFW の初期化に失敗しました。";

  // プログラム終了時には GLFW を終了する
  atexit(glfwTerminate);

  // OpenGL Version 3.2 Core Profile を選択する
  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
  glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
  glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

  // ウィンドウを開く
  Window window("Depth Map Viewer");
  if (!window.get()) throw "GLFW のウィンドウが開けませんでした。";

  // 深度センサを有効にする
#if USE_KINECT_V1
  KinectV1 sensor;
#elif USE_KINECT_V2
  KinectV2 sensor;
#elif USE_DEPTH_SENSE
  Ds325 sensor;
#endif
  if (sensor.getActivated() == 0) throw "深度センサを有効にできませんでした。";

  // 深度センサの解像度
  int width, height;
  sensor.getDepthResolution(&width, &height);

  // 描画に使うメッシュ
  const Mesh mesh(width, height, sensor.getCoordBuffer());

  // 描画用のシェーダ
  const GgSimpleShader simple("simple.vert", "simple.frag");

  // 光源データ
  const GgSimpleShader::LightBuffer light(lightData);

  // 材質データ
  const GgSimpleShader::MaterialBuffer material(materialData);

  // デプスデータから頂点位置を計算するシェーダ
  const Calculate position(width, height, "position.frag");
  const GLuint scaleLoc(glGetUniformLocation(position.get(), "scale"));
  const GLuint depthMaxLoc(glGetUniformLocation(position.get(), "depthMax"));
  const GLuint depthScaleLoc(glGetUniformLocation(position.get(), "depthScale"));

  // 頂点位置から法線ベクトルを計算するシェーダ
  const Calculate normal(width, height, "normal.frag");

  // 背景色を設定する
  glClearColor(background[0], background[1], background[2], background[3]);

  // 隠面消去処理を有効にする
  glEnable(GL_DEPTH_TEST);
  glEnable(GL_CULL_FACE);

  // ウィンドウが開いている間くり返し描画する
  while (!window.shouldClose())
  {
#if GENERATE_POSITION
    // 頂点位置の計算
    position.use();
    glUniform4fv(scaleLoc, 1, sensor.getScale());
    glUniform1i(0, 0);
    glActiveTexture(GL_TEXTURE0);
    sensor.getDepth();
    const std::vector<GLuint> &positionTexture(position.calculate());

    // 法線ベクトルの計算
    normal.use();
    glUniform1i(0, 0);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, positionTexture[0]);
    const std::vector<GLuint> &normalTexture(normal.calculate());
#else
    // 法線ベクトルの計算
    normal.use();
    glUniform1i(0, 0);
    glActiveTexture(GL_TEXTURE0);
    sensor.getPoint();
    const std::vector<GLuint> &normalTexture(normal.calculate());
#endif

    // 画面消去
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    // ビューポートをもとに戻す
    window.resetViewport();

    // プロジェクション変換行列
    const GgMatrix mp(ggPerspective(cameraFovy, window.getAspect(), cameraNear, cameraFar));

    // モデルビュー変換行列
    const GgMatrix mw(ggTranslate(0.0f, 0.0f, window.getWheel() * 0.1f) * window.getTrackball() * ggTranslate(objectCenter));

    // 描画用のシェーダプログラムの使用開始
    simple.use();
    simple.loadMatrix(mp, mw);
    simple.selectLight(light);
    simple.selectMaterial(material);

#if GENERATE_POSITION
    // 頂点座標テクスチャ
    glUniform1i(0, 0);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, positionTexture[0]);
#endif

    // 法線ベクトルテクスチャ
    glUniform1i(1, 1);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_2D, normalTexture[0]);

    // 背景テクスチャ
    glUniform1i(2, 2);
    glActiveTexture(GL_TEXTURE2);
    sensor.getColor();

    // 図形描画
    mesh.draw();

    // バッファを入れ替える
    window.swapBuffers();
  }
}
