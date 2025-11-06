# WebSocket 서버 마스터 방식 구현 가이드

## 개요

WebSocket 서버를 마스터로 사용하여 가격 데이터를 중앙 관리하는 방식입니다.
Next.js API는 필요 시 WebSocket 서버에서 가격을 동기화합니다.

## WebSocket 서버에 추가해야 할 HTTP API

WebSocket 서버에 다음 3개의 HTTP API 엔드포인트를 추가해야 합니다:

### 1. GET /api/prices - 모든 코인 가격 조회

**요청:**
```
GET /api/prices
```

**응답:**
```json
{
  "success": true,
  "prices": {
    "btc": 50000.5,
    "eth": 3000.2,
    "balx": 25.8,
    ...
  }
}
```

**구현 예시:**
```typescript
// Express.js 예시
app.get('/api/prices', (req, res) => {
  const prices: Record<string, number> = {}
  
  // priceCache에서 모든 코인 가격 가져오기
  for (const [coinId, priceData] of priceCache.entries()) {
    const coin = getCoinById(coinId)
    if (coin) {
      prices[coin.symbol.toLowerCase()] = priceData.price
    }
  }
  
  res.json({
    success: true,
    prices
  })
})
```

---

### 2. GET /api/prices/:symbol - 특정 코인 가격 조회

**요청:**
```
GET /api/prices/btc
GET /api/prices/balx
```

**응답:**
```json
{
  "success": true,
  "price": 50000.5
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": "Coin not found"
}
```

**구현 예시:**
```typescript
app.get('/api/prices/:symbol', (req, res) => {
  const symbol = req.params.symbol.toLowerCase()
  const coin = getCoinBySymbol(symbol)
  
  if (!coin) {
    return res.status(404).json({
      success: false,
      error: "Coin not found"
    })
  }
  
  const priceData = priceCache.get(coin.id)
  if (!priceData) {
    return res.status(404).json({
      success: false,
      error: "Price not found"
    })
  }
  
  res.json({
    success: true,
    price: priceData.price
  })
})
```

---

### 3. POST /api/prices/:symbol - 코인 가격 업데이트 (관리자용)

**요청:**
```
POST /api/prices/btc
Content-Type: application/json

{
  "price": 51000.0
}
```

**응답:**
```json
{
  "success": true,
  "symbol": "btc",
  "oldPrice": 50000.5,
  "newPrice": 51000.0
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": "Invalid price"
}
```

**구현 예시:**
```typescript
app.post('/api/prices/:symbol', (req, res) => {
  const symbol = req.params.symbol.toLowerCase()
  const { price } = req.body
  
  if (typeof price !== 'number' || price <= 0) {
    return res.status(400).json({
      success: false,
      error: "Invalid price"
    })
  }
  
  const coin = getCoinBySymbol(symbol)
  if (!coin) {
    return res.status(404).json({
      success: false,
      error: "Coin not found"
    })
  }
  
  const priceData = priceCache.get(coin.id)
  const oldPrice = priceData?.price || coin.basePrice
  
  // 가격 업데이트
  const now = Date.now()
  priceCache.set(coin.id, { price, lastUpdate: now })
  
  // 히스토리에 추가
  addPriceToHistory(coin.id, price, now)
  
  // 다음 변동 예약
  if (!pausedFluctuations.has(coin.id)) {
    const nextChange = generateNextPriceChange(coin.id)
    nextPriceChanges.set(coin.id, nextChange)
  }
  
  // WebSocket으로 모든 클라이언트에 브로드캐스트
  broadcastPriceUpdate({
    coinId: coin.id,
    symbol: coin.symbol,
    price,
    change1h: 0, // 필요 시 계산
    change24h: 0, // 필요 시 계산
    change1w: 0, // 필요 시 계산
  })
  
  res.json({
    success: true,
    symbol: coin.symbol.toLowerCase(),
    oldPrice,
    newPrice: price
  })
})
```

---

## WebSocket 서버에 요청할 내용 (추천 문구)

다음과 같이 요청하시면 됩니다:

---

### 📝 요청 문구

```
WebSocket 서버에 HTTP API 3개를 추가해줘:

1. GET /api/prices
   - 모든 코인 가격을 반환
   - 응답 형식: { success: true, prices: { "btc": 50000.5, "eth": 3000.2, ... } }

2. GET /api/prices/:symbol
   - 특정 코인 가격을 반환
   - 응답 형식: { success: true, price: 50000.5 }

3. POST /api/prices/:symbol
   - 코인 가격을 업데이트 (관리자용)
   - 요청 본문: { price: 51000.0 }
   - 응답 형식: { success: true, symbol: "btc", oldPrice: 50000.5, newPrice: 51000.0 }
   - 가격 업데이트 후 WebSocket으로 모든 클라이언트에 브로드캐스트

이 API들은 Next.js 프로젝트에서 WebSocket 서버를 마스터로 사용하여 가격을 동기화하기 위해 필요해.
```

---

## 동작 흐름

### 1. 클라이언트 (브라우저)
- WebSocket으로 실시간 가격 수신
- 변경 없음 (이미 구현됨)

### 2. Next.js API
- 필요 시 WebSocket 서버에서 가격 동기화 (5초마다)
- 관리자 가격 변경 시 WebSocket 서버에도 업데이트

### 3. WebSocket 서버
- 가격 변동 관리 (마스터)
- HTTP API로 가격 조회/업데이트 제공
- WebSocket으로 실시간 브로드캐스트

---

## 환경 변수

Next.js 프로젝트의 `.env.local`에 다음을 추가:

```env
NEXT_PUBLIC_WEBSOCKET_URL=wss://cryptox-websocket.onrender.com/api/ws/coins
```

이 값은 WebSocket 서버의 URL이며, HTTP API URL은 자동으로 변환됩니다:
- `wss://` → `https://`
- `ws://` → `http://`
- `/api/ws/coins` → 제거

---

## 테스트 방법

### 1. WebSocket 서버 API 테스트

```bash
# 모든 가격 조회
curl https://cryptox-websocket.onrender.com/api/prices

# 특정 코인 가격 조회
curl https://cryptox-websocket.onrender.com/api/prices/btc

# 가격 업데이트
curl -X POST https://cryptox-websocket.onrender.com/api/prices/btc \
  -H "Content-Type: application/json" \
  -d '{"price": 51000.0}'
```

### 2. Next.js API 테스트

관리자 페이지에서 가격 변경을 시도하면:
1. 로컬 `priceCache` 업데이트
2. WebSocket 서버에 HTTP 요청으로 가격 업데이트
3. WebSocket 서버가 모든 클라이언트에 브로드캐스트

---

## 주의사항

1. **인증/권한**: WebSocket 서버의 `POST /api/prices/:symbol` API는 관리자만 사용할 수 있도록 인증을 추가하는 것을 권장합니다. (현재는 구현하지 않았지만, 필요 시 추가 가능)

2. **에러 처리**: WebSocket 서버가 다운된 경우에도 Next.js API는 로컬 캐시를 사용하여 동작합니다.

3. **동기화 주기**: 현재 5초마다 동기화하도록 설정되어 있습니다. 필요에 따라 조정 가능합니다.

4. **강제 동기화**: `syncPricesFromMaster(true)`를 호출하면 캐시가 있어도 강제로 동기화합니다. (현재는 사용하지 않음)

