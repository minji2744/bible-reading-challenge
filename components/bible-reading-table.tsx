"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookMarked } from "lucide-react"

type ChapterReading = {
  book: string
  chapter: number
  count: number
}

type BibleBook = {
  book: string
  chapters: number
}

const bibleChapters: BibleBook[] = [
  { book: "Genesis", chapters: 50 },
  { book: "Exodus", chapters: 40 },
  { book: "Leviticus", chapters: 27 },
  { book: "Numbers", chapters: 36 },
  { book: "Deuteronomy", chapters: 34 },
  { book: "Joshua", chapters: 24 },
  { book: "Judges", chapters: 20 },
  { book: "Ruth", chapters: 4 },
  { book: "1 Samuel", chapters: 31 },
  { book: "2 Samuel", chapters: 24 },
  { book: "1 Kings", chapters: 22 },
  { book: "2 Kings", chapters: 25 },
  { book: "1 Chronicles", chapters: 29 },
  { book: "2 Chronicles", chapters: 36 },
  { book: "Ezra", chapters: 10 },
  { book: "Nehemiah", chapters: 10 },
  { book: "Esther", chapters: 10 },
  { book: "Job", chapters: 42 },
  { book: "Psalms", chapters: 150 },
  { book: "Proverbs", chapters: 31 },
  { book: "Ecclesiastes", chapters: 12 },
  { book: "Song of Solomon", chapters: 8 },
  { book: "Isaiah", chapters: 66 },
  { book: "Jeremiah", chapters: 52 },
  { book: "Lamentations", chapters: 5 },
  { book: "Ezekiel", chapters: 50 },
  { book: "Daniel", chapters: 12 },
  { book: "Hosea", chapters: 14 },
  { book: "Joel", chapters: 3 },
  { book: "Amos", chapters: 9 },
  { book: "Obadiah", chapters: 1 },
  { book: "Jonah", chapters: 4 },
  { book: "Micah", chapters: 7 },
  { book: "Nahum", chapters: 3 },
  { book: "Habakkuk", chapters: 3 },
  { book: "Zephaniah", chapters: 3 },
  { book: "Haggai", chapters: 2 },
  { book: "Zechariah", chapters: 14 },
  { book: "Malachi", chapters: 4 },
  { book: "Matthew", chapters: 28 },
  { book: "Mark", chapters: 16 },
  { book: "Luke", chapters: 24 },
  { book: "John", chapters: 21 },
  { book: "Acts", chapters: 28 },
  { book: "Romans", chapters: 16 },
  { book: "1 Corinthians", chapters: 16 },
  { book: "2 Corinthians", chapters: 13 },
  { book: "Galatians", chapters: 6 },
  { book: "Ephesians", chapters: 6 },
  { book: "Philippians", chapters: 4 },
  { book: "Colossians", chapters: 4 },
  { book: "1 Thessalonians", chapters: 5 },
  { book: "2 Thessalonians", chapters: 3 },
  { book: "1 Timothy", chapters: 6 },
  { book: "2 Timothy", chapters: 4 },
  { book: "Titus", chapters: 3 },
  { book: "Philemon", chapters: 1 },
  { book: "Hebrews", chapters: 13 },
  { book: "James", chapters: 5 },
  { book: "1 Peter", chapters: 5 },
  { book: "2 Peter", chapters: 3 },
  { book: "1 John", chapters: 5 },
  { book: "2 John", chapters: 1 },
  { book: "3 John", chapters: 1 },
  { book: "Jude", chapters: 1 },
  { book: "Revelation", chapters: 22 },
]

const getKoreanBookName = (bookName: string): string => {
  const bookMap: Record<string, string> = {
    Genesis: "창세기",
    Exodus: "출애굽기",
    Leviticus: "레위기",
    Numbers: "민수기",
    Deuteronomy: "신명기",
    Joshua: "여호수아",
    Judges: "사사기",
    Ruth: "룻기",
    "1 Samuel": "사무엘상",
    "2 Samuel": "사무엘하",
    "1 Kings": "열왕기상",
    "2 Kings": "열왕기하",
    "1 Chronicles": "역대상",
    "2 Chronicles": "역대하",
    Ezra: "에스라",
    Nehemiah: "느헤미야",
    Esther: "에스더",
    Job: "욥기",
    Psalms: "시편",
    Proverbs: "잠언",
    Ecclesiastes: "전도서",
    "Song of Solomon": "아가",
    Isaiah: "이사야",
    Jeremiah: "예레미야",
    Lamentations: "예레미야애가",
    Ezekiel: "에스겔",
    Daniel: "다니엘",
    Hosea: "호세아",
    Joel: "요엘",
    Amos: "아모스",
    Obadiah: "오바댜",
    Jonah: "요나",
    Micah: "미가",
    Nahum: "나훔",
    Habakkuk: "하박국",
    Zephaniah: "스바냐",
    Haggai: "학개",
    Zechariah: "스가랴",
    Malachi: "말라기",
    Matthew: "마태복음",
    Mark: "마가복음",
    Luke: "누가복음",
    John: "요한복음",
    Acts: "사도행전",
    Romans: "로마서",
    "1 Corinthians": "고린도전서",
    "2 Corinthians": "고린도후서",
    Galatians: "갈라디아서",
    Ephesians: "에베소서",
    Philippians: "빌립보서",
    Colossians: "골로새서",
    "1 Thessalonians": "데살로니가전서",
    "2 Thessalonians": "데살로니가후서",
    "1 Timothy": "디모데전서",
    "2 Timothy": "디모데후서",
    Titus: "디도서",
    Philemon: "빌레몬서",
    Hebrews: "히브리서",
    James: "야고보서",
    "1 Peter": "베드로전서",
    "2 Peter": "베드로후서",
    "1 John": "요한일서",
    "2 John": "요한이서",
    "3 John": "요한삼서",
    Jude: "유다서",
    Revelation: "요한계시록",
  }
  return bookMap[bookName] || bookName
}

export function BibleReadingTable({ userId }: { userId: string }) {
  const [readings, setReadings] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [thisMonthCount, setThisMonthCount] = useState(0)
  const [thisWeekCount, setThisWeekCount] = useState(0)

  // Fetch all readings for this user
  useEffect(() => {
    const fetchReadings = async () => {
      setIsLoading(true)
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from("readings")
          .select("book, start_chapter, chapters_read, reading_date")
          .eq("user_id", userId)

        if (error) throw error

        // Build a map of book+chapter -> count
        const readingMap = new Map<string, number>()
        let monthCount = 0
        let weekCount = 0

        if (data) {
          const today = new Date()
          const currentMonth = today.getMonth()
          const currentYear = today.getFullYear()

          // Get start of this week (Monday)
          const currentDay = today.getDay()
          const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - daysToMonday)
          weekStart.setHours(0, 0, 0, 0)

          data.forEach((reading) => {
            const readingDate = new Date(reading.reading_date)

            if (reading.book && reading.start_chapter) {
              // Count each chapter in the range
              const endChapter = reading.start_chapter + reading.chapters_read - 1
              for (let ch = reading.start_chapter; ch <= endChapter; ch++) {
                const key = `${reading.book}:${ch}`
                readingMap.set(key, (readingMap.get(key) || 0) + 1)
              }
            }

            // Count for this month
            if (readingDate.getMonth() === currentMonth && readingDate.getFullYear() === currentYear) {
              monthCount += reading.chapters_read || 0
            }

            // Count for this week (from Monday to today)
            if (readingDate >= weekStart && readingDate <= today) {
              weekCount += reading.chapters_read || 0
            }
          })
        }

        setReadings(readingMap)
        setThisMonthCount(monthCount)
        setThisWeekCount(weekCount)
      } catch (err) {
        console.error("Error fetching readings:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReadings()
  }, [userId])

  const handleChapterClick = async (book: string, chapter: number) => {
    const supabase = createClient()
    const key = `${book}:${chapter}`
    const today = new Date().toISOString().split("T")[0]

    try {
      // Insert new reading with chapters_read = 1
      console.log("Attempting to insert:", { userId, book, chapter, today })
      
      const response = await supabase
        .from("readings")
        .insert({
          user_id: userId,
          book: book,
          start_chapter: chapter,
          chapters_read: 1,
          reading_date: today,
        })

      console.log("Full response:", response)
      const { data, error: insertError } = response

      console.log("Data:", data)
      console.log("Error:", insertError)

      if (insertError) {
        // If duplicate key error on (user_id, reading_date, book, start_chapter), do nothing
        if (insertError.code === "23505") {
          console.log("Duplicate entry found, not updating or inserting again.")
          // Just return; do not update or throw error
          return
        }
        else {
          console.error("Insert error:", insertError)
          throw insertError
        }
      }

      // Update local state
      const newReadings = new Map(readings)
      newReadings.set(key, 1)
      setReadings(newReadings)

      // Update statistics
      setThisMonthCount(thisMonthCount + 1)
      setThisWeekCount(thisWeekCount + 1)
    } catch (err) {
      console.error("Error updating reading:", err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">이번 달 읽기</p>
              <p className="text-4xl font-bold text-amber-600">{thisMonthCount}</p>
              <p className="text-xs text-muted-foreground mt-1">장</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">이번 주 읽기</p>
              <p className="text-4xl font-bold text-amber-600">{thisWeekCount}</p>
              <p className="text-xs text-muted-foreground mt-1">장</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bible Reading Table */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <BookMarked className="h-5 w-5" />
            성경 읽기 기록
          </CardTitle>
          <CardDescription>성경책의 각 장을 읽은 후 클릭하여 기록하세요. 숫자는 읽은 횟수입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">로딩 중...</p>
          ) : (
            <div className="space-y-8 overflow-x-auto">
              {bibleChapters.map((book) => (
              <div key={book.book}>
                <h3 className="mb-3 font-semibold text-amber-900">{getKoreanBookName(book.book)}</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => {
                    const key = `${book.book}:${chapter}`
                    const count = readings.get(key) || 0
                    const isRead = count > 0

                    return (
                      <button
                        key={chapter}
                        onClick={() => handleChapterClick(book.book, chapter)}
                        className={`relative h-12 w-12 flex items-center justify-center rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${
                          isRead
                            ? "bg-green-500 text-white shadow-md hover:bg-green-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {chapter}
                        {isRead && (
                          <span className="absolute bottom-1 right-1 text-xs font-bold bg-white text-green-600 rounded-full w-4 h-4 flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  )
}

