param( 
   [Parameter(Mandatory = $true)] [string]$BaseUrl, 
   [Parameter(Mandatory = $true)] [string]$Username, 
   [Parameter(Mandatory = $true)] [string]$Password, 
   [Parameter(Mandatory = $true)] [string]$ProjectId, 
   [Parameter(Mandatory = $true)] [string]$UserId, 
   [Parameter(Mandatory = $true)] [string]$BlocksJson 
 ) 
 
 # Step 1: Auth token 
 Write-Host "Requesting token..." 
 $tokenBody = @{ 
   username = $Username 
   password = $Password 
 } 
 try { 
   $tokenResponse = Invoke-RestMethod -Uri "$BaseUrl/token" -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $tokenBody 
   $jwt = $tokenResponse.access_token 
   Write-Host "Token acquired." 
 } 
 catch { 
   Write-Error ("Failed to get token. {0}" -f $_.Exception.Message) 
   exit 1 
 } 
 
 # Step 2: Prepare collected blocks 
 $collected_blocks = $BlocksJson | ConvertFrom-Json 
 if ($null -eq $collected_blocks -or $collected_blocks.Count -eq 0) { 
   Write-Error "No blocks provided." 
   exit 1 
 } 
 
 # Step 3: Build main body 
 $body = @{ 
   project_id = $ProjectId 
   user_id    = $UserId 
   blocks     = $collected_blocks 
 } 
 $json = $body | ConvertTo-Json -Depth 6 
 
 # Step 4: Send one POST request 
 Write-Host "Sending one aggregated POST /tts request..." 
 $headers = @{ 
   "Authorization" = "Bearer $jwt" 
   "Content-Type"  = "application/json" 
 } 
 try { 
   $createResponse = Invoke-RestMethod -Uri "$BaseUrl/tts" -Method Post -Headers $headers -Body $json -ContentType 'application/json' 
   $job_id = $createResponse.job_id 
   Write-Host ("Job created: {0}" -f $job_id) 
 } 
 catch { 
   Write-Error ("Failed to create TTS job. {0}" -f $_.Exception.Message) 
   exit 1 
 } 
 
 # Step 5: Poll until completed 
 $statusUrl = "$BaseUrl/status/$job_id" 
 $status = "" 
 Write-Host "Waiting for completion..." 
 do { 
   Start-Sleep -Seconds 2 
   $statusResponse = Invoke-RestMethod -Uri $statusUrl -Headers $headers -Method Get 
   $status = $statusResponse.status 
   Write-Host ("Status: {0}" -f $status) 
 } until ($status -eq "completed" -or $status -eq "failed") 
 
 if ($status -eq "failed") { 
   Write-Error "TTS job failed." 
   exit 1 
 } 
 
 # Step 6: Get final merged audio 
 $resultUrl = "$BaseUrl/result/$job_id" 
 try { 
   $resultResponse = Invoke-RestMethod -Uri $resultUrl -Headers $headers -Method Get 
   $final_audio = $resultResponse.final_audio_url 
   Write-Host "Merged audio ready:" 
   Write-Host $final_audio 
 } 
 catch { 
   Write-Error ("Failed to get result. {0}" -f $_.Exception.Message) 
   exit 1 
 } 
 
 # Step 7: Output JSON summary 
 $summary = @{ 
   project_id = $ProjectId 
   job_id = $job_id 
   final_audio = $final_audio 
   created_blocks_count = $collected_blocks.Count 
   merged_once = $true 
 } 
 $summary | ConvertTo-Json -Depth 6