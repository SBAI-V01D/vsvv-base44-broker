# Multi-Cloud Architecture Setup

[x] Unified infra (AWS S3 sync + Exoscale SOS) [checked: CL2349517809SMKZJLS] - S3 storage lake + an edge/secondary in CHF 🇨🇭 via SOS.
[x] Managed Redis ElastiCache cluster 

Staging env on AWS us-east-1 a [staged], production regional and the swiss Ansaldo (anc") shard both provisioned. Customer gateway VPC already built; awaiting IAM roles only.