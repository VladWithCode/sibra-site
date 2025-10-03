// Package uploads provides functions for uploading files
package uploads

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"
)

const (
	RemoveImgFlag      = "delete"
	MaxImageUploadSize = 64 << 20 // 64MB

	DefaultUploadsPath = "web/static/uploads"
)

var (
	ErrFileHeaderOpenFail = errors.New("failed to open file from fileheader")
	ErrFileCreateFail     = errors.New("failed to create output file")
	ErrFileCopyFail       = errors.New("failed to copy file")

	UploadsPath = os.Getenv("UPLOADS_PATH")
)

// WrittenFile contains the `Filename` of the written file as well as the `Size` of the file
type WrittenFile struct {
	Filename string
	Size     int64
}

// FileData is a struct that contains the filename the given file header will be
// written to and the file header itself
type FileData struct {
	Filename string
	File     *multipart.FileHeader
}

// writeFile takes a file header and writes it to the given path
func writeFile(file *multipart.FileHeader, writePath string) (int64, error) {
	inFile, err := file.Open()
	if err != nil {
		return 0, errors.Join(ErrFileHeaderOpenFail, err)
	}
	defer inFile.Close()

	outFile, err := os.Create(writePath)
	if err != nil {
		return 0, errors.Join(ErrFileCreateFail, err)
	}
	defer outFile.Close()

	written, err := io.Copy(outFile, inFile)
	if err != nil {
		return 0, errors.Join(ErrFileCopyFail, err)
	}

	return written, nil
}

// Upload takes a file and writes it to the uploads directory with the given filename.
//
// If the file already exists, it will be overwritten.
func Upload(file *FileData) (filename string, err error) {
	uploadsPath := getUploadsPath()

	filename = fmt.Sprintf("%s%s", file.Filename, filepath.Ext(file.File.Filename))
	writePath := filepath.Join(uploadsPath, filename)
	_, err = writeFile(file.File, writePath)
	if err != nil {
		return "", err
	}

	return filename, nil
}

func UploadMultiple(files []*multipart.FileHeader) (writtenFiles []*WrittenFile, err error) {
	date := time.Now().Format("2006-01-02T15:04:05")
	uploadsPath := getUploadsPath()
	writtenFiles = make([]*WrittenFile, len(files))

	for i, fHeader := range files {
		filename := fmt.Sprintf("upload_%s_%d%s", date, i, filepath.Ext(fHeader.Filename))
		writePath := filepath.Join(uploadsPath, filename)

		sz, err := writeFile(fHeader, writePath)
		if err != nil {
			return nil, err
		}

		writtenFiles[i] = &WrittenFile{
			Filename: filename,
			Size:     sz,
		}
	}

	return writtenFiles, nil
}

func Delete(filename string) error {
	uploadsPath := getUploadsPath()
	delPath := filepath.Join(uploadsPath, filename)

	return os.Remove(delPath)
}

func DeleteMultiple(filenames []string) error {
	uploadsPath := getUploadsPath()
	for _, filename := range filenames {
		delPath := filepath.Join(uploadsPath, filename)
		err := os.Remove(delPath)
		if err != nil {
			return err
		}
	}

	return nil
}

func getUploadsPath() string {
	if UploadsPath == "" {
		return DefaultUploadsPath
	}
	return UploadsPath
}
