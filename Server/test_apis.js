const axios = require('axios');

async function testApis() {
    try {
        // Test HUD
        console.log("Testing HUD...");
        const hudUrl = 'https://www.huduser.gov/hudapi/public/fmr/statedata/CA';
        const hudToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI2IiwianRpIjoiYmU0ZWJkNzJhMDVlZjZhZmE4ODI3ZWZiZjYwZTg2ODE3YTZlMzcwMDMxMTE0ZGU1ZDZkNDFkZjc1YjJjN2UxMWI3ODI1ZGFkODJjYjZkMDMiLCJpYXQiOjE3ODAzNzA5MzcuOTE4MTkzLCJuYmYiOjE3ODAzNzA5MzcuOTE4MTk2LCJleHAiOjIwOTU5OTAxMzcuOTE0MDIsInN1YiI6IjEyODc4OSIsInNjb3BlcyI6W119.ZKEe-6E2kShWHu7GrEUYbGAnkXvn7fgQHU4bZiQM7DQMmpnhV8wSo2aaDzfiMOYDRFXkWCzNIvUCH7orFQuV5A';
        try {
            const hudRes = await axios.get(hudUrl, { headers: { Authorization: `Bearer ${hudToken}` } });
            console.log("HUD SUCCESS:", Object.keys(hudRes.data));
        } catch (e) {
            console.log("HUD ERROR:", e.response?.status, e.response?.statusText, e.response?.data);
        }

        // Test FBI State
        console.log("Testing FBI State...");
        const fbiStateUrl = 'https://api.usa.gov/crime/fbi/cde/summarized/state/CA/all-offenses/2022?api_key=AiibLxLZagxbDUattbuwJ9n4gN5L9JWUAi6Pv7B1';
        try {
            const fbiRes = await axios.get(fbiStateUrl);
            console.log("FBI SUCCESS:", fbiRes.data?.results?.length ? 'Got results' : fbiRes.data);
        } catch (e) {
            console.log("FBI ERROR:", e.response?.status, e.response?.statusText, e.response?.data);
        }
        
        // Test FBI State with old sapi URL
        console.log("Testing FBI State (sapi)...");
        const fbiStateUrlSapi = 'https://api.usa.gov/crime/fbi/sapi/api/summarized/state/CA/all-offenses/2022?api_key=AiibLxLZagxbDUattbuwJ9n4gN5L9JWUAi6Pv7B1';
        try {
            const fbiResSapi = await axios.get(fbiStateUrlSapi);
            console.log("FBI SAPI SUCCESS:", fbiResSapi.data?.results?.length ? 'Got results' : fbiResSapi.data);
        } catch (e) {
            console.log("FBI SAPI ERROR:", e.response?.status, e.response?.statusText, e.response?.data);
        }

        // Test FBI State with correct sapi URL (no /api)
        console.log("Testing FBI State (sapi no /api)...");
        const fbiStateUrlSapi2 = 'https://api.usa.gov/crime/fbi/sapi/api/data/state/CA/violent-crime/2020/2022?api_key=AiibLxLZagxbDUattbuwJ9n4gN5L9JWUAi6Pv7B1';
        try {
            const fbiResSapi2 = await axios.get(fbiStateUrlSapi2);
            console.log("FBI SAPI2 SUCCESS:", fbiResSapi2.data?.results?.length ? 'Got results' : fbiResSapi2.data);
        } catch (e) {
            console.log("FBI SAPI2 ERROR:", e.response?.status, e.response?.statusText, e.response?.data);
        }

    } catch (err) {
        console.error(err);
    }
}
testApis();
