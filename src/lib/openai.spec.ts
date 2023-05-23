import { openAIWithStream} from "./openai";

jest.useRealTimers();
jest.setTimeout(60000)

describe("", () => {


  it("should success ", async () => {
   await openAIWithStream("DDD 是什么？",
      {
        apiKey: "sk-0PfcSdT723UR44igwVxvEWvLoZJgi0FJyZWy0WCCATp5ka2a",
        baseUrl: "https://api.chatanywhere.com.cn/v1",
        completionEngine : "gpt-3.5-turbo",
        temperature: 1.0,
        maxTokens: 1000,
        dalleImageSize: 1024,
        chatPrompt: "DDD 是什么？"
      }, (content) => {console.log(content)},
      () => {console.log("end")});
  });

  it("test parseData", () => {
//     const input = `data: {"id":"chatcmpl-7JGtOE3xENhKDU9WjsP2PxAz8hbVO","object":"chat.completion.chunk","created":1684827522,"model":"gpt-3.5-turbo-0301","choices":[{"delta":{"role":"assistant"},"index":0,"finish_reason":null}]}
// data: {"id":"chatcmpl-7JGtOE3xENhKDU9WjsP2PxAz8hbVO","object":"chat.completion.chunk","created":1684827522,"model":"gpt-3.5-turbo-0301","choices":[{"delta":{"content":"领"},"index":0,"finish_reason":null}]}`;

    const input = 'data: {"id":"chatcmpl-7JHA8qpKCZAHTEmmnQCSU7oISmFft","object":"chat.completion.chunk","created":1684828560,"model":"gpt-3.5-turbo-0301","choices":[{"delta":{"content":"知"},"index":0,"finish_reason":null}]}'

    const matches = [...input.split("data: ")];
    console.log(JSON.stringify(matches));
    const data = matches.filter(content => content.trim().length > 0)
      .map(match => JSON.parse(match));
    console.log(data);
  })
});