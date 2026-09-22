import io
import unittest

from function_app import _uploads


class FakeFile:
    def __init__(self, filename, content):
        self.filename = filename
        self.content_type = "application/pdf"
        self.stream = io.BytesIO(content)


class FakeFiles:
    def __init__(self, files):
        self.files = files

    def items(self, multi=False):
        if multi:
            return [("files", file) for file in self.files]
        return [("files", self.files[-1])]


class FunctionTests(unittest.TestCase):
    def test_repeated_multipart_field_keeps_all_nonempty_files(self):
        request = type(
            "Request",
            (),
            {
                "files": FakeFiles(
                    [
                        FakeFile("one.pdf", b"one"),
                        FakeFile("empty.pdf", b""),
                        FakeFile("two.pdf", b"two"),
                    ]
                )
            },
        )()
        uploads = _uploads(request)
        self.assertEqual([upload.filename for upload in uploads], ["one.pdf", "two.pdf"])


if __name__ == "__main__":
    unittest.main()
