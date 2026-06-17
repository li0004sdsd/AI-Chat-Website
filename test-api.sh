#!/bin/bash

echo "=========================================="
echo "  全面后端API测试"
echo "=========================================="

cd "$(dirname "$0")"

rm -f backend/database.sqlite

echo ""
echo "1. 测试健康检查接口"
echo "------------------------------------------"
curl -s http://localhost:3001/api/health

echo ""
echo ""
echo "2. 测试用户注册"
echo "------------------------------------------"
REGISTER_RESP=$(curl -s -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"123456"}')
echo "$REGISTER_RESP"

TOKEN=$(echo "$REGISTER_RESP" | sed 's/.*"token":"\([^"]*\)".*/\1/')

echo ""
echo ""
echo "3. 测试用户登录"
echo "------------------------------------------"
LOGIN_RESP=$(curl -s -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}')
echo "$LOGIN_RESP"

echo ""
echo ""
echo "4. 测试获取当前用户信息"
echo "------------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/users/me

echo ""
echo ""
echo "5. 测试获取人设列表"
echo "------------------------------------------"
PERSONAS_RESP=$(curl -s http://localhost:3001/api/personas)
PERSONA_COUNT=$(echo "$PERSONAS_RESP" | sed 's/.*"total":\([0-9]*\).*/\1/')
echo "总人设数量: $PERSONA_COUNT"
echo ""
echo "人设分类:"
curl -s http://localhost:3001/api/personas/categories

echo ""
echo ""
echo "6. 测试获取模型列表"
echo "------------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/models

echo ""
echo ""
echo "7. 测试获取用户设置"
echo "------------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/settings

echo ""
echo ""
echo "8. 测试更新用户设置"
echo "------------------------------------------"
curl -s -X PUT http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"language":"en","theme":"dark","default_model":"deepseek"}'

echo ""
echo ""
echo "9. 测试创建对话（爱因斯坦人设）"
echo "------------------------------------------"
CONV_RESP=$(curl -s -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"与爱因斯坦对话","personaId":"einstein","modelProvider":"deepseek"}')
echo "$CONV_RESP"

CONV_ID=$(echo "$CONV_RESP" | sed 's/.*"id":"\([^"]*\)".*/\1/')

echo ""
echo ""
echo "10. 测试获取对话列表"
echo "------------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/conversations

echo ""
echo ""
echo "11. 测试AI对话（发送消息给爱因斯坦）"
echo "------------------------------------------"
MSG_RESP=$(curl -s -X POST "http://localhost:3001/api/conversations/$CONV_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"你好，请用一句话介绍一下你自己"}')
echo "$MSG_RESP"

echo ""
echo ""
echo "12. 测试获取对话详情"
echo "------------------------------------------"
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/conversations/$CONV_ID"

echo ""
echo ""
echo "13. 测试心理医生人设对话"
echo "------------------------------------------"
CONV2_RESP=$(curl -s -X POST http://localhost:3001/api/conversations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"心理咨询","personaId":"psychologist-zhang","modelProvider":"deepseek"}')
CONV2_ID=$(echo "$CONV2_RESP" | sed 's/.*"id":"\([^"]*\)".*/\1/')

curl -s -X POST "http://localhost:3001/api/conversations/$CONV2_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"我最近工作压力很大，经常失眠，怎么办？"}'

echo ""
echo ""
echo "14. 测试删除对话"
echo "------------------------------------------"
curl -s -X DELETE -H "Authorization: Bearer $TOKEN" "http://localhost:3001/api/conversations/$CONV2_ID"

echo ""
echo ""
echo "=========================================="
echo "  API测试完成！"
echo "=========================================="
