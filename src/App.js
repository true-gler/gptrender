import logo from './logo.svg';
import './App.css';
import { useEffect } from "react";
import { useState } from 'react';
import { AzureKeyCredential } from "@azure/core-auth";
import { OpenAIClient } from "@azure/openai";
import React, { useRef } from 'react';

const key = new AzureKeyCredential("<insert key here>");
const client = new OpenAIClient("https://<link>.openai.azure.com", key);

export default function App() {
  const [html, setHtml] = useState();
  const [message, setMessage] = useState();
  const [javascript, setJavascript] = useState();
  const [css, setCss] = useState();
  const [inputValue, setInputValue] = useState("a red ball that follows the radius of a circle");
  const [isLoading, setIsLoading] = useState(false);
  const rightSection = document.querySelector('.RightSection');

  useEffect(() => {
    if (javascript) {
      try {
        new Function(javascript)();
        setIsLoading(false);
      } catch (error) {
        console.error("Error executing JavaScript code: ", error);
      }
    }
  }, [javascript]);

  const clear = () => {
    setHtml("");
    setJavascript("");
    setCss("");
    setMessage("");

    document.getElementById('promptScripts').innerHTML = '';
    document.getElementById('promptCSS').innerHTML = '';
    document.getElementById('promptHTML').innerHTML = '';

    setIsLoading(false);

  }
  const getGPTResult = async () => {
    setIsLoading(true);
    const deploymentId = "gpt-35-turbo";

    const messages = [
      {
        role: "system", content: `Generate code that creates an object named codeObject adhering to the following schema:
      - "html": a string representing HTML code
      - "css": a string representing CSS code
      - "javascript": a string representing JavaScript code` },
      {
        role: "user", content: `Generate code that creates an object named codeObject adhering to the following schema:
      - "html": a string representing HTML code
      - "css": a string representing CSS code
      - "javascript": a string representing JavaScript code
      The code should do the following ${inputValue}`
      }
    ];

    console.log(`Messages: ${messages.map((m) => m.content).join("\n")}`);
    var res = "";
    const events = client.listChatCompletions(deploymentId, messages, { temperature: 0 });

    for await (const event of events) {
      for (const choice of event.choices) {
        const delta = choice.delta?.content;
        if (delta !== undefined) {
          res += delta;
        }
      }
    }

    try {
      res = res.split('codeObject = ')[1].split(';\n```')[0].trim();
      const wrappedString = `(${res})`;
      const myObject = eval(wrappedString);

      setHtml(myObject.html);
      setJavascript(myObject.javascript);
      setCss(myObject.css);

    } catch (e) {
      setMessage(res);
    }

    setIsLoading(false);
  };

  const toggleFold = () => {
    rightSection.classList.toggle('folded');
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    getGPTResult();
  };

  return (


    <div className="App">
      <div className="Main">
        <div className="LeftSection">
          <div className="Header">
            <form className='formPrompt' onSubmit={handleFormSubmit}>
              <input
                type='text'
                placeholder='Enter prompt here'
                name="myInput"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className='inputPrompt'
              />
              <button type='submit' onClick={getGPTResult} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Submit prompt'}
              </button>
            </form>
            <button type='submit' onClick={clear}> clear </button>
            <button onClick={toggleFold}>{"Hide/Show"}</button>
          </div>
          <div className='Result'>
            {message}
            <script id="promptScripts" dangerouslySetInnerHTML={{ __html: javascript }} />
            <div id="promptHTML" dangerouslySetInnerHTML={{ __html: html }} />
            <style id="promptCSS" dangerouslySetInnerHTML={{ __html: css }} />
          </div>
        </div>
        <div className="RightSection">
          <div className="RightSection-Top">

            <div className="HeaderLine">
              <hr />
              <span className="HeaderText">HTML</span>
            </div>
            <pre>{html}</pre>
          </div>
          <div className="RightSection-Middle">
            <div className="HeaderLine">
              <hr />
              <span className="HeaderText">JavaScript</span>
            </div>
            <pre>{javascript}</pre>
          </div>
          <div className="RightSection-Bottom">
            <div className="HeaderLine">
              <hr />
              <span className="HeaderText">CSS</span>
            </div>
            <pre>{css}</pre>
          </div>
        </div>
      </div>
    </div >
  );
}