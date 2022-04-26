import { Command, string as stringArg } from "https://deno.land/x/clay@v0.2.5/mod.ts";

// Handle arguments
const args = new Command('Subtitle Auto Verification')
  .optional(stringArg, 'source', { flags: ['s', 'source'], description: 'Source subtitle file (omit to read from standard input)' })
  .optional(stringArg, 'target', { flags: ['t', 'target'], description: 'Target subtitle file (omit to write to standard output)' })
  .flag('no-libass-check', { description: 'Skip libass handling' })
  .flag('no-font-check', { description: 'Skip font handling' })
  .run()

const sourcePath = args.source || undefined
const targetPath = args.target || undefined
const skipLibass = args['no-libass-check']
const skipFont = args['no-font-check']

// Load subtitle data from stdin if file reading is not enabled or one was not provided
let data
const readDescriptor = { name: 'read', path: sourcePath } as const
const readPermissions = await Deno.permissions.query(readDescriptor)

if (!sourcePath) {
  data = await new Response(await Deno.stdin.readable).text()
} else if (readPermissions.state === 'granted') {
  data = await Deno.readTextFile(sourcePath)
} else {
  throw Error('Cannot read file ' + sourcePath)
}

// Handle styles
const existentStyles = Array.from(data.matchAll(/^Style:\s*([^,]+)/gm)).map(e => e[1])
const getRandomStyleName = () => {
  let i = 2
  while (true) {
    const name = Math.random().toString(36).substr(2, i)
    if (!existentStyles.includes(name)) {
      existentStyles.push(name)
      return name
    }
    i++
  }
}

// Add the style and a warning about the fonts
if (!skipFont) {
  const warnStyle = getRandomStyleName()
  data = data.replace(/^(Style:.*)/m, (all, existentStyle) => {
    return 'Style: ' + warnStyle + ',The Invisible Font,40,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,' +
      '-1,0,0,0,100,100,0,0,1,2,1,5,0,0,0,0\n' + existentStyle
  }).replace(/^(Dialogue:.*)/m, (all, existentDialogue) => {
    return 'Dialogue: 0,0:00:00.00,0:00:30.00,' + warnStyle +
      ',,0000,0000,0000,,Embedded fonts were not loaded:\\NPlease check your player settings.\n' + existentDialogue
  })
}

// Handle the libass warning
if (!skipLibass) {
  const defaultReplacement = getRandomStyleName()
  const warnStyle = getRandomStyleName()

  // Switch Style and Effect in the format line
  data = data.replace(/^(\[Events\]\s+Format:)(.*)/gm, (all, prefix, rest) => {
    rest = rest.split(/ *, */g)
    const temp = rest[8]
    rest[8] = rest[3]
    rest[3] = temp
    return prefix + rest.join(',')
  })

  // Move the Style to the Effect place in dialog lines
  data = data.replace(/^(Dialogue:)(.*)/gm, (all, prefix, rest) => {
    rest = rest.split(/ *, */g)
    rest[8] = rest[3] === 'Default' ? defaultReplacement : rest[3]
    rest[3] = ''
    return prefix + rest.join(',')
  })

  // Rename the default style if it exists
  data = data.replace(/^(Style: *Default)(,.*)/m, (all, prefix, rest) => {
    return 'Style: ' + defaultReplacement + rest
  })

  // Add new styles
  data = data.replace(/^(Style:.*)/m, (all, existentStyle) => {
    return 'Style: Default,Arial,1,&HFFFFFFFF,&HFFFFFFFF,&HFFFFFFFF,&HFFFFFFFF,' + 
      '-1,0,0,0,100,100,0,0,1,2,1,2,0,0,0,0\n' +
      'Style: ' + warnStyle + 
      ',Arial,40,&H00FFFFFF,&H0000FFFF,&H00000000,&H7F404040,' +
      '-1,0,0,0,100,100,0,0,1,2,1,5,0,0,0,0\n' + 
      existentStyle
  })

  // Add a warning about the player
  data = data.replace(/^(Dialogue:.*)/m, (all, existentDialogue) => {
    return 'Dialogue: 0,0:00:00.00,0:00:30.00,' + warnStyle +
      ',,0000,0000,0000,,This subtitle is not compatible with your player.\n' + existentDialogue
  })
}

// Store the subtitle if it's allowed and an output path was provided, otherwise output it to stdout:
if (targetPath) {
  const writeDescriptor = { name: 'write', path: targetPath } as const
  const writePermissions = await Deno.permissions.query(writeDescriptor)
  if (readPermissions.state === 'granted') {
    await Deno.writeTextFile(targetPath, data)
  } else {
    throw Error('Cannot write file ' + targetPath)
  }
} else {
  console.log(data)
}
