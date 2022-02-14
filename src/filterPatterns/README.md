# Filter Patterns

The plugin will automatically scan your event mappings and supports the following filter pattern functionality:

### Multiple rules

Note that AWS has a limit of 5 filter rules per event mapping unless a quote increase is requested. The plugin does not
currently enforce this.

### Equality Match

```yaml
# firstName = John
filterPatterns:
  dynamodb:
    NewImage:
      firstName:
        S:
          - John
```

```yaml
# age = 45
filterPatterns:
  dynamodb:
    NewImage:
      age:
        N:
          - 45
```

### Logical AND

```yaml
# eventName = INSERT AND firstName = John
filterPatterns:
  - eventName:
      - INSERT
    dynamodb:
      NewImage:
        firstName:
          S:
            - John
```

### Logical OR

```yaml

# eventName = INSERT OR eventName = MODIFY
filterPatterns:
  - eventName:
      - INSERT
      - MODIFY
```

```yaml
# firstName = John OR firstName = Bob
filterPatterns:
  dynamodb:
    NewImage:
      firstName:
        S:
          - John
          - Bob   
```

### Logical NOT

```yaml
# firstName NOT John
filterPatterns:
  dynamodb:
    NewImage:
      firstName:
        anything-but:
          - John
```

### Null Matching

```yaml
# firstName is null
filterPatterns:
  dynamodb:
    NewImage:
      firstName:
        - null
```

### Numeric Comparison

The example is for equality but supports the following operators: [<, <=, =, >=, >]

```yaml
# age = 30
filterPatterns:
  dynamodb:
    NewImage:
      age:
        numeric:
          - =
          - 30
```

### Numeric Range Comparison

Range comparison supports any valid combination of the operators for Numeric Comparison

```yaml
# age > 30 AND <= 45
filterPatterns:
  dynamodb:
    NewImage:
      age:
        numeric:
          - >
          - 30
          - <=
          - 45
```

### Exists / Doesn't Exist

```yaml
# firstName property exists. lastName property does not exist
filterPatterns:
  dynamodb:
    NewImage:
      firstName:
        exists: true
      lastName:
        exists: false
```

### Begins With

```yaml
# firstName begins with "JO" OR firstName begins with "BO" 
filterPatterns:
  dynamodb:
    NewImage:
      firstName:
        prefix:
          - JO
          - BO
```
