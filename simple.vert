#version 150 core
#extension GL_ARB_explicit_attrib_location : enable
#extension GL_ARB_explicit_uniform_location : enable

// ����
layout (std140) uniform Light
{
  vec4 lamb;                                          // ��������
  vec4 ldiff;                                         // �g�U���ˌ�����
  vec4 lspec;                                         // ���ʔ��ˌ�����
  vec4 lpos;                                          // �ʒu
};

// �ގ�
layout (std140) uniform Material
{
  vec4 kamb;                                          // �����̔��ˌW��
  vec4 kdiff;                                         // �g�U���ˌW��
  vec4 kspec;                                         // ���ʔ��ˌW��
  float kshi;                                         // �P���W��
};

// �ϊ��s��
uniform mat4 mv;                                      // ���f���r���[�ϊ��s��
uniform mat4 mp;                                      // ���e�ϊ��s��
uniform mat4 mn;                                      // �@���x�N�g���̕ϊ��s��

// �e�N�X�`��
layout (location = 0) uniform sampler2D position;     // ���_�ʒu�̃e�N�X�`��
layout (location = 1) uniform sampler2D normal;       // �@���x�N�g���̃e�N�X�`��
layout (location = 2) uniform sampler2D color;        // �J���[�̃e�N�X�`��

// ���_����
layout (location = 0) in vec2 pc;                     // ���_�̃e�N�X�`�����W
layout (location = 1) in vec2 cc;                     // �J���[�̃e�N�X�`�����W

// ���X�^���C�U�ɑ��钸�_����
out vec4 idiff;                                       // �g�U���ˌ����x
out vec4 ispec;                                       // ���ʔ��ˌ����x
out vec2 texcoord;                                    // �e�N�X�`�����W

void main(void)
{
  // ���_�ʒu
  vec4 pv = texture(position, pc);

  // �@���x�N�g��
  vec4 nv = texture(normal, pc);

  // ���W�v�Z
  vec4 p = mv * pv;                                   // ���_���W�n�̒��_�̈ʒu
  vec3 v = normalize(p.xyz);                          // �����x�N�g��
  vec3 l = normalize((lpos * p.w - p * lpos.w).xyz);  // �����x�N�g��
  vec3 n = normalize((mn * nv).xyz);                  // �@���x�N�g��
  vec3 h = normalize(l - v);                          // ���ԃx�N�g��

  // �A�e�v�Z
  idiff = max(dot(n, l), 0.0) * kdiff * ldiff + kamb * lamb;
  ispec = pow(max(dot(n, h), 0.0), kshi) * kspec * lspec;

  // �e�N�X�`�����W
  texcoord = cc / vec2(textureSize(color, 0));

  // �N���b�s���O���W�n�ɂ�������W�l
  gl_Position = mp * p;
}
