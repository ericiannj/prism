#!/usr/bin/env bash
set -uo pipefail

# ---------------------------------------------------------------------------
# Read-only audit of AWS resources that bill by the hour or by storage.
#
# Walks every enabled region and prints only the checks that found something.
# Meant to run in AWS CloudShell after decommissioning EC2/RDS, to confirm
# nothing paid was left behind. Makes no changes.
# ---------------------------------------------------------------------------

check() {
  local label="$1"
  shift
  local out
  out="$("$@" --output text 2>/dev/null | sed '/^None$/d;/^$/d')"
  if [[ -n "$out" ]]; then
    echo "  [$label]"
    echo "$out" | sed 's/^/    /'
  fi
}

echo "== global"
check "cloudfront distributions" aws cloudfront list-distributions \
  --query 'DistributionList.Items[].[Id,Aliases.Items[0],Origins.Items[0].DomainName]'
check "s3 buckets" aws s3api list-buckets --query 'Buckets[].Name'

for r in $(aws ec2 describe-regions --query 'Regions[].RegionName' --output text); do
  echo "== $r"
  check "ec2 instances" aws ec2 describe-instances --region "$r" \
    --filters Name=instance-state-name,Values=pending,running,stopping,stopped \
    --query 'Reservations[].Instances[].[InstanceId,State.Name,InstanceType]'
  check "ebs volumes" aws ec2 describe-volumes --region "$r" \
    --query 'Volumes[].[VolumeId,Size,State]'
  check "ebs snapshots" aws ec2 describe-snapshots --region "$r" --owner-ids self \
    --query 'Snapshots[].[SnapshotId,VolumeSize,StartTime]'
  check "amis" aws ec2 describe-images --region "$r" --owners self \
    --query 'Images[].[ImageId,Name]'
  check "elastic ips" aws ec2 describe-addresses --region "$r" \
    --query 'Addresses[].[PublicIp,AllocationId,AssociationId]'
  check "public ipv4 on network interfaces" aws ec2 describe-network-interfaces --region "$r" \
    --query 'NetworkInterfaces[?Association.PublicIp].[NetworkInterfaceId,Association.PublicIp,Description]'
  check "nat gateways" aws ec2 describe-nat-gateways --region "$r" \
    --filter Name=state,Values=pending,available \
    --query 'NatGateways[].NatGatewayId'
  check "load balancers" aws elbv2 describe-load-balancers --region "$r" \
    --query 'LoadBalancers[].LoadBalancerName'
  check "rds instances" aws rds describe-db-instances --region "$r" \
    --query 'DBInstances[].[DBInstanceIdentifier,DBInstanceStatus]'
  check "rds manual snapshots" aws rds describe-db-snapshots --region "$r" --snapshot-type manual \
    --query 'DBSnapshots[].DBSnapshotIdentifier'
  check "rds retained backups" aws rds describe-db-instance-automated-backups --region "$r" \
    --query 'DBInstanceAutomatedBackups[].DBInstanceIdentifier'
  check "secrets manager" aws secretsmanager list-secrets --region "$r" \
    --query 'SecretList[].Name'
  check "cloudwatch alarms" aws cloudwatch describe-alarms --region "$r" \
    --query 'MetricAlarms[].AlarmName'
  check "lambda functions" aws lambda list-functions --region "$r" \
    --query 'Functions[].FunctionName'
  check "amplify apps" aws amplify list-apps --region "$r" \
    --query 'apps[].[name,defaultDomain]'
  check "sqs queues" aws sqs list-queues --region "$r" --query 'QueueUrls'
  check "sns topics" aws sns list-topics --region "$r" --query 'Topics[].TopicArn'
done

echo "== done"
