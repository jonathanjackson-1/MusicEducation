import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

let sdk: NodeSDK | undefined;

export async function startTelemetry(serviceName: string) {
  if (sdk) {
    return sdk;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]:
      process.env.npm_package_version ?? '0.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.NODE_ENV ?? 'development',
  });

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        'http://localhost:4318/v1/traces',
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS,
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  await sdk.start();
  return sdk;
}

export async function shutdownTelemetry() {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = undefined;
}
