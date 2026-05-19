import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage, secondaryStorage } from './storage/resource';
import { Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  storage,
  secondaryStorage
});

// Reference existing S3 bucket
const emailBucket = Bucket.fromBucketName(
  Stack.of(backend.auth.resources.authenticatedUserIamRole),
  'EmailAttachBucket',
  'email-attach-xxx'
);

// Grant authenticated users access to the existing bucket
const emailBucketPolicy = new Policy(
  Stack.of(backend.auth.resources.authenticatedUserIamRole),
  'EmailBucketPolicy',
  {
    statements: [
      new PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${emailBucket.bucketArn}/*`],
      }),
      new PolicyStatement({
        actions: ['s3:ListBucket'],
        resources: [emailBucket.bucketArn],
      }),
    ],
  }
);

backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(emailBucketPolicy);

// Add existing bucket info to custom output
backend.addOutput({
  custom: {
    emailAttachBucket: emailBucket.bucketName,
    emailAttachBucketRegion: 'ap-northeast-2',
  },
});
