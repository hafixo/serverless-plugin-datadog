/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2019 Datadog, Inc.
 */

import { FunctionInfo, RuntimeType } from "./layer";

export const datadogHandlerEnvVar = "DD_LAMBDA_HANDLER";
export const pythonHandler = "datadog_lambda.handler.handler";
export const pythonHandlerFile = "datadog_lambda.handler.py";
export const jsHandlerLayerPrefix = "/opt/nodejs/";
export const jsHandler = "node_modules/datadog-lambda-js/handler.handler";
export const jsHandlerFile = "node_modules/datadog-lambda-js/handler.js";

/**
 * For each lambda function, redirects handler to the Datadog handler for the given runtime,
 * and sets Datadog environment variable `DD_LAMBDA_HANDLER` to the original handler.
 */
export function redirectHandlers(funcs: FunctionInfo[], addLayers: boolean) {
  funcs.forEach((func) => {
    setEnvDatadogHandler(func);
    const handlerInfo = getDDHandler(func.type, addLayers);
    if (handlerInfo === undefined) {
      return;
    }
    const { handler, handlerFile } = handlerInfo;
    func.handler.handler = handler;

    if (func.handler.package === undefined) {
      func.handler.package = {
        exclude: [],
        include: [],
      };
    }
    if (func.handler.package.include === undefined) {
      func.handler.package.include = [];
    }
  });
}

function getDDHandler(lambdaRuntime: RuntimeType | undefined, addLayers: boolean) {
  if (lambdaRuntime === undefined) {
    return;
  }
  switch (lambdaRuntime) {
    case RuntimeType.NODE:
      const finalJsHandler = addLayers ? `${jsHandlerLayerPrefix}${jsHandler}` : jsHandler;
      const finalJsHandlerFile = addLayers ? `${jsHandlerLayerPrefix}${jsHandlerFile}` : jsHandlerFile;
      return { handler: finalJsHandler, handlerFile: finalJsHandlerFile };
    case RuntimeType.PYTHON:
      return { handler: pythonHandler, handlerFile: pythonHandlerFile };
  }
}

function setEnvDatadogHandler(func: FunctionInfo) {
  const originalHandler = func.handler.handler;
  const environment = (func.handler as any).environment ?? {};
  environment[datadogHandlerEnvVar] = originalHandler;
  (func.handler as any).environment = environment;
}
